import { products, orders, processedEvents, events } from "@shared/schema";
import type {
  Product,
  InsertProduct,
  Order,
  InsertOrder,
  ProductWrite,
  Event,
  TrackEvent,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { eq, sql, desc, lte, and } from "drizzle-orm";
import { seedProducts } from "./seed";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required but not set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

// Fields stored as JSON text in the DB but exposed to admins as arrays.
const ARRAY_FIELDS = ["sizes", "colors", "tags"] as const;

// Convert an admin ProductWrite payload into DB column values: array fields are
// serialized to JSON text; everything else passes through untouched.
function toRow(input: Partial<ProductWrite>): Record<string, unknown> {
  const row: Record<string, unknown> = { ...input };
  for (const f of ARRAY_FIELDS) {
    if (f in row) {
      const v = row[f];
      row[f] = v == null ? null : JSON.stringify(v);
    }
  }
  return row;
}

export interface IStorage {
  listProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(input: ProductWrite): Promise<Product>;
  updateProduct(id: number, input: Partial<ProductWrite>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  adjustStock(productId: number, delta: number): Promise<Product | undefined>;
  setStock(productId: number, qty: number): Promise<Product | undefined>;
  listLowStock(): Promise<Product[]>;
  createOrder(order: InsertOrder & { orderNumber: string; createdAt: number }): Promise<Order>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrderBySessionId(sessionId: string): Promise<Order | undefined>;
  listOrders(): Promise<Order[]>;
  listOrdersByStatus(status: string): Promise<Order[]>;
  setOrderStripeSession(orderNumber: string, sessionId: string): Promise<void>;
  markOrderPaid(orderNumber: string, paymentIntentId?: string): Promise<void>;
  markOrderStatus(orderNumber: string, status: string): Promise<void>;
  eventAlreadyProcessed(eventId: string): Promise<boolean>;
  recordProcessedEvent(eventId: string, type: string): Promise<void>;
  // Analytics
  recordEvent(input: TrackEvent): Promise<void>;
  analyticsSummary(sinceMs: number): Promise<AnalyticsSummary>;
  salesTimeseries(sinceMs: number): Promise<TimeseriesPoint[]>;
  topProducts(sinceMs: number, limit: number): Promise<TopProduct[]>;
  behaviorFunnel(sinceMs: number): Promise<FunnelStep[]>;
  ordersByStatus(): Promise<Array<{ status: string; count: number }>>;
  recentEvents(limit: number): Promise<Event[]>;
}

// ---- Analytics result shapes ----
export interface AnalyticsSummary {
  revenue: number;
  paidOrders: number;
  totalOrders: number;
  avgOrderValue: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  beginCheckouts: number;
  sessions: number;
  conversionRate: number; // paid orders / sessions
}
export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}
export interface TopProduct {
  productId: number;
  name: string;
  unitsSold: number;
  revenue: number;
}
export interface FunnelStep {
  step: string;
  count: number;
}

export class DatabaseStorage implements IStorage {
  async listProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return row;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return row;
  }

  async createProduct(input: ProductWrite): Promise<Product> {
    const row = toRow(input);
    row.inStock = (input.stockQty ?? 0) > 0;
    const [created] = await db.insert(products).values(row as typeof products.$inferInsert).returning();
    return created;
  }

  async updateProduct(
    id: number,
    input: Partial<ProductWrite>
  ): Promise<Product | undefined> {
    const row = toRow(input);
    if (typeof input.stockQty === "number") {
      row.inStock = input.stockQty > 0;
    }
    if (Object.keys(row).length === 0) {
      return this.getProductById(id);
    }
    const [updated] = await db
      .update(products)
      .set(row as Partial<typeof products.$inferInsert>)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const rows = await db.delete(products).where(eq(products.id, id)).returning();
    return rows.length > 0;
  }

  async adjustStock(productId: number, delta: number): Promise<Product | undefined> {
    const product = await this.getProductById(productId);
    if (!product) return undefined;
    const next = Math.max(0, product.stockQty + delta);
    const [updated] = await db
      .update(products)
      .set({ stockQty: next, inStock: next > 0 })
      .where(eq(products.id, productId))
      .returning();
    return updated;
  }

  async setStock(productId: number, qty: number): Promise<Product | undefined> {
    const next = Math.max(0, Math.floor(qty));
    const [updated] = await db
      .update(products)
      .set({ stockQty: next, inStock: next > 0 })
      .where(eq(products.id, productId))
      .returning();
    return updated;
  }

  async listLowStock(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(lte(products.stockQty, products.lowStockThreshold))
      .orderBy(products.stockQty);
  }

  async createOrder(
    order: InsertOrder & { orderNumber: string; createdAt: number }
  ): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    return row;
  }

  async getOrderBySessionId(sessionId: string): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId)).limit(1);
    return row;
  }

  async listOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async listOrdersByStatus(status: string): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
  }

  async setOrderStripeSession(orderNumber: string, sessionId: string): Promise<void> {
    await db.update(orders)
      .set({ stripeSessionId: sessionId })
      .where(eq(orders.orderNumber, orderNumber));
  }

  async markOrderPaid(orderNumber: string, paymentIntentId?: string): Promise<void> {
    await db.update(orders)
      .set({ status: "paid", stripePaymentIntentId: paymentIntentId ?? null })
      .where(eq(orders.orderNumber, orderNumber));
  }

  async markOrderStatus(orderNumber: string, status: string): Promise<void> {
    await db.update(orders).set({ status }).where(eq(orders.orderNumber, orderNumber));
  }

  async eventAlreadyProcessed(eventId: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(processedEvents)
      .where(eq(processedEvents.eventId, eventId))
      .limit(1);
    return !!row;
  }

  async recordProcessedEvent(eventId: string, type: string): Promise<void> {
    await db.insert(processedEvents)
      .values({ eventId, type, processedAt: Date.now() })
      .onConflictDoNothing();
  }

  // ---- Analytics ----

  async recordEvent(input: TrackEvent): Promise<void> {
    await db.insert(events)
      .values({
        type: input.type,
        sessionId: input.sessionId ?? null,
        path: input.path ?? null,
        productId: input.productId ?? null,
        value: input.value ?? null,
        createdAt: Date.now(),
      });
  }

  async analyticsSummary(sinceMs: number): Promise<AnalyticsSummary> {
    const revResult = await db.execute(sql`
      SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*)::int AS "paidOrders"
      FROM orders WHERE status IN ('paid','fulfilled','shipped') AND created_at >= ${sinceMs}
    `);
    const rev = revResult.rows[0] as { revenue: number; paidOrders: number };

    const totalOrdersResult = await db.execute(sql`
      SELECT COUNT(*)::int AS c FROM orders WHERE created_at >= ${sinceMs}
    `);
    const totalOrders = (totalOrdersResult.rows[0] as { c: number }).c;

    const evCount = async (type: string): Promise<number> => {
      const result = await db.execute(sql`
        SELECT COUNT(*)::int AS c FROM events WHERE type = ${type} AND created_at >= ${sinceMs}
      `);
      return (result.rows[0] as { c: number }).c;
    };

    const sessionsResult = await db.execute(sql`
      SELECT COUNT(DISTINCT session_id)::int AS c FROM events WHERE session_id IS NOT NULL AND created_at >= ${sinceMs}
    `);
    const sessions = (sessionsResult.rows[0] as { c: number }).c;

    const pageViews = await evCount("page_view");
    const productViews = await evCount("product_view");
    const addToCarts = await evCount("add_to_cart");
    const beginCheckouts = await evCount("begin_checkout");
    const revenue = +Number(rev.revenue).toFixed(2);
    const paidOrders = rev.paidOrders;
    return {
      revenue,
      paidOrders,
      totalOrders,
      avgOrderValue: paidOrders > 0 ? +(revenue / paidOrders).toFixed(2) : 0,
      pageViews,
      productViews,
      addToCarts,
      beginCheckouts,
      sessions,
      conversionRate:
        sessions > 0 ? +((paidOrders / sessions) * 100).toFixed(1) : 0,
    };
  }

  async salesTimeseries(sinceMs: number): Promise<TimeseriesPoint[]> {
    const result = await db.execute(sql`
      SELECT to_char(to_timestamp(created_at / 1000.0), 'YYYY-MM-DD') AS date,
             COALESCE(SUM(total),0) AS revenue,
             COUNT(*)::int AS orders
      FROM orders
      WHERE status IN ('paid','fulfilled','shipped') AND created_at >= ${sinceMs}
      GROUP BY to_char(to_timestamp(created_at / 1000.0), 'YYYY-MM-DD')
      ORDER BY 1
    `);
    const rows = result.rows as Array<{ date: string; revenue: number; orders: number }>;
    return rows.map((r) => ({
      date: r.date,
      revenue: +Number(r.revenue).toFixed(2),
      orders: r.orders,
    }));
  }

  async topProducts(sinceMs: number, limit: number): Promise<TopProduct[]> {
    // Aggregate from each paid order's items JSON in application code.
    const result = await db.execute(sql`
      SELECT items FROM orders WHERE status IN ('paid','fulfilled','shipped') AND created_at >= ${sinceMs}
    `);
    const rows = result.rows as Array<{ items: string }>;
    const agg = new Map<number, { name: string; units: number; revenue: number }>();
    for (const row of rows) {
      let items: any[] = [];
      try {
        items = JSON.parse(row.items);
      } catch {
        items = [];
      }
      if (!Array.isArray(items)) continue;
      for (const it of items) {
        const pid = Number(it?.productId);
        const qty = Math.max(0, Math.floor(Number(it?.qty) || 0));
        const price = Number(it?.price) || 0;
        if (!Number.isFinite(pid) || pid <= 0 || qty <= 0) continue;
        const cur = agg.get(pid) ?? { name: it?.name ?? `#${pid}`, units: 0, revenue: 0 };
        cur.units += qty;
        cur.revenue += price * qty;
        if (!cur.name && it?.name) cur.name = it.name;
        agg.set(pid, cur);
      }
    }
    return Array.from(agg.entries())
      .map(([productId, v]) => ({
        productId,
        name: v.name,
        unitsSold: v.units,
        revenue: +v.revenue.toFixed(2),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async behaviorFunnel(sinceMs: number): Promise<FunnelStep[]> {
    const summary = await this.analyticsSummary(sinceMs);
    return [
      { step: "Page views", count: summary.pageViews },
      { step: "Product views", count: summary.productViews },
      { step: "Add to cart", count: summary.addToCarts },
      { step: "Begin checkout", count: summary.beginCheckouts },
      { step: "Purchases", count: summary.paidOrders },
    ];
  }

  async ordersByStatus(): Promise<Array<{ status: string; count: number }>> {
    const result = await db.execute(sql`
      SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC
    `);
    return result.rows as Array<{ status: string; count: number }>;
  }

  async recentEvents(limit: number): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.createdAt)).limit(limit);
  }
}

export const storage = new DatabaseStorage();

// Seed products once on boot if the table is empty.
// Called from server/index.ts during startup.
export async function ensureSeed(): Promise<void> {
  const [countRow] = await db.select({ c: sql<number>`count(*)::int` }).from(products);
  if (!countRow || countRow.c === 0) {
    for (const p of seedProducts) {
      await db.insert(products).values(p);
    }
    console.log(`Seeded ${seedProducts.length} products.`);
  }

  // Backfill inventory for products created before stock tracking existed.
  // Give any product still at 0 a sensible demo quantity and sync the inStock flag.
  await db.update(products)
    .set({ stockQty: 25, inStock: true })
    .where(and(eq(products.stockQty, 0), eq(products.inStock, true)));
}
