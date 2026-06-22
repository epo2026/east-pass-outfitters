import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { z } from "zod";
import { storage } from "./storage";
import {
  checkoutSchema,
  productCreateSchema,
  productWriteSchema,
  trackEventSchema,
} from "@shared/schema";
import { stripeEnabled, createCheckoutSession, handleWebhook } from "./payments";
import { randomBytes, timingSafeEqual } from "node:crypto";

function genOrderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `EPO-${n}`;
}

// ---------------------------------------------------------------------------
// ADMIN AUTHENTICATION
//
// A single owner password (ADMIN_PASSWORD) gates the admin dashboard. On a
// successful login we mint a random session token held in memory and hand it
// to the client, which sends it back as a Bearer token on every admin request.
//
// In this sandbox preview, browser storage (localStorage/cookies) is blocked,
// so the client keeps the token in memory only -> a page refresh requires a
// fresh login. In production (Vercel + Neon) this should be swapped for an
// httpOnly cookie session so logins persist; the password check below stays.
//
// ADMIN_TOKEN (a static shared secret) is still honored via the x-admin-token
// header for scripts/CI, independent of the login flow.
// ---------------------------------------------------------------------------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "emeraldcoast2026";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// In-memory set of valid session tokens (cleared on server restart).
const sessionTokens = new Set<string>();

function issueSessionToken(): string {
  const token = randomBytes(32).toString("hex");
  sessionTokens.add(token);
  return token;
}

// Constant-time string comparison to avoid leaking the password via timing.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function bearerToken(req: Request): string | undefined {
  const h = req.headers.authorization;
  if (typeof h === "string" && h.startsWith("Bearer ")) return h.slice(7).trim();
  return undefined;
}

// Gate admin endpoints. Accepts EITHER a valid login session token (Bearer) OR
// the static x-admin-token shared secret.
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req);
  if (token && sessionTokens.has(token)) return next();
  if (ADMIN_TOKEN && req.headers["x-admin-token"] === ADMIN_TOKEN) return next();
  return res.status(401).json({ message: "Unauthorized" });
}

// Body schema for the stock endpoint: either set an absolute qty or apply a
// signed delta (adjust). At least one is required.
const stockSchema = z
  .object({
    qty: z.number().int().optional(),
    delta: z.number().int().optional(),
  })
  .refine((v) => v.qty !== undefined || v.delta !== undefined, {
    message: "Provide either qty or delta",
  });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/products", async (_req, res) => {
    const all = await storage.listProducts();
    res.json(all);
  });

  app.get("/api/products/:slug", async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // Tells the frontend whether the production Stripe path is active so it can
  // choose between hosted Checkout redirect and the demo flow.
  app.get("/api/config", (_req, res) => {
    res.json({ stripeEnabled });
  });

  // -------------------------------------------------------------------------
  // ADMIN LOGIN. Exchanges the owner password for a session token. The token
  // is returned in the body; the client stores it in memory and sends it as
  // `Authorization: Bearer <token>` on subsequent admin calls.
  // -------------------------------------------------------------------------
  app.post("/api/admin/login", (req, res) => {
    const password = (req.body?.password ?? "").toString();
    if (!password || !safeEqual(password, ADMIN_PASSWORD)) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    const token = issueSessionToken();
    res.json({ token });
  });

  // Validate the current session token (used by the client on mount).
  app.get("/api/admin/session", requireAdmin, (_req, res) => {
    res.json({ valid: true });
  });

  // Invalidate the current session token.
  app.post("/api/admin/logout", (req, res) => {
    const token = bearerToken(req);
    if (token) sessionTokens.delete(token);
    res.json({ ok: true });
  });

  // -------------------------------------------------------------------------
  // ANALYTICS TRACKING (public). The storefront fires lightweight behavior
  // events here. Invalid payloads are silently accepted as no-ops so tracking
  // never breaks the storefront.
  // -------------------------------------------------------------------------
  app.post("/api/track", async (req, res) => {
    const parsed = trackEventSchema.safeParse(req.body);
    if (parsed.success) {
      try {
        await storage.recordEvent(parsed.data);
      } catch (e) {
        console.error("track failed:", e);
      }
    }
    res.status(204).end();
  });

  // -------------------------------------------------------------------------
  // PRODUCTION CHECKOUT (Stripe Checkout Session).
  // Creates a pending order with server-validated pricing, opens a Stripe
  // Checkout Session, and returns the hosted URL to redirect to. The order is
  // only marked paid later, by the verified webhook.
  // -------------------------------------------------------------------------
  app.post("/api/checkout/session", async (req, res) => {
    if (!stripeEnabled) {
      return res.status(503).json({ message: "Payments are not configured" });
    }
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid checkout details", errors: parsed.error.flatten() });
    }
    const { items, ...customer } = parsed.data;

    try {
      const orderNumber = genOrderNumber();
      // Re-price authoritatively via Stripe helper (DB prices only).
      const { url, sessionId, subtotal, shipping } = await createCheckoutSession({
        items,
        customer,
        orderNumber,
      });

      // Tax is collected by Stripe (automatic_tax) or shown as $0 here; the
      // authoritative totals are reconciled from the webhook session object.
      await storage.createOrder({
        ...customer,
        items: JSON.stringify(items),
        subtotal,
        shipping,
        tax: 0,
        total: +(subtotal + shipping).toFixed(2),
        orderNumber,
        createdAt: Date.now(),
      });
      await storage.setOrderStripeSession(orderNumber, sessionId);

      res.json({ url, orderNumber });
    } catch (err) {
      const e = err as Error;
      res.status(400).json({ message: e.message || "Could not start checkout" });
    }
  });

  // -------------------------------------------------------------------------
  // DEMO CHECKOUT (fallback when Stripe is not configured).
  // Creates a "paid" order immediately with estimated tax. Used by the sandbox
  // preview so the storefront is fully clickable without live keys.
  // -------------------------------------------------------------------------
  app.post("/api/checkout", async (req, res) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid checkout details", errors: parsed.error.flatten() });
    }
    const { items, ...customer } = parsed.data;
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal >= 75 ? 0 : 7.95;
    const tax = +(subtotal * 0.07).toFixed(2);
    const total = +(subtotal + shipping + tax).toFixed(2);

    const order = await storage.createOrder({
      ...customer,
      items: JSON.stringify(items),
      subtotal: +subtotal.toFixed(2),
      shipping,
      tax,
      total,
      orderNumber: genOrderNumber(),
      createdAt: Date.now(),
    });
    res.json(order);
  });

  app.get("/api/orders/:orderNumber", async (req, res) => {
    const order = await storage.getOrderByNumber(req.params.orderNumber);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  // Admin: list all orders (most recent first). In production this should be
  // protected behind authentication.
  app.get("/api/orders", async (_req, res) => {
    const all = await storage.listOrders();
    res.json(all);
  });

  // -------------------------------------------------------------------------
  // STRIPE WEBHOOK — the single source of truth for fulfillment.
  // Signature is verified against the raw body (captured by express.json's
  // verify callback in index.ts). Returns 400 on bad signature so Stripe
  // retries; returns 200 once handled (idempotent).
  // -------------------------------------------------------------------------
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const result = await handleWebhook(req);
      res.json(result);
    } catch (err) {
      const e = err as any;
      const status = e.statusCode || 500;
      console.error("Webhook error:", e.message);
      res.status(status).json({ message: e.message });
    }
  });

  // =========================================================================
  // ADMIN API: product catalog management, inventory, and order fulfillment.
  // All routes are gated by requireAdmin (x-admin-token header in production).
  // =========================================================================

  // Create a product.
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    const parsed = productCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid product", errors: parsed.error.flatten() });
    }
    try {
      const product = await storage.createProduct(parsed.data);
      res.status(201).json(product);
    } catch (err) {
      const e = err as Error;
      res.status(400).json({ message: e.message || "Could not create product" });
    }
  });

  // Update a product (partial).
  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid id" });
    const parsed = productWriteSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid product", errors: parsed.error.flatten() });
    }
    const product = await storage.updateProduct(id, parsed.data);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // Delete a product.
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid id" });
    const ok = await storage.deleteProduct(id);
    if (!ok) return res.status(404).json({ message: "Product not found" });
    res.status(204).end();
  });

  // Set or adjust stock for a product.
  app.post("/api/admin/products/:id/stock", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid id" });
    const parsed = stockSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid stock payload", errors: parsed.error.flatten() });
    }
    const product =
      parsed.data.qty !== undefined
        ? await storage.setStock(id, parsed.data.qty)
        : await storage.adjustStock(id, parsed.data.delta as number);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // Low-stock report (stock at or below each product's threshold).
  app.get("/api/admin/inventory/low", requireAdmin, async (_req, res) => {
    const low = await storage.listLowStock();
    res.json(low);
  });

  // List orders, optionally filtered by ?status=.
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const ordersList = status
      ? await storage.listOrdersByStatus(status)
      : await storage.listOrders();
    res.json(ordersList);
  });

  // Update an order's fulfillment status (e.g. "fulfilled", "shipped").
  app.patch("/api/admin/orders/:orderNumber/status", requireAdmin, async (req, res) => {
    const status = (req.body?.status ?? "").toString().trim();
    if (!status) return res.status(400).json({ message: "status is required" });
    const orderNumber = String(req.params.orderNumber);
    const order = await storage.getOrderByNumber(orderNumber);
    if (!order) return res.status(404).json({ message: "Order not found" });
    await storage.markOrderStatus(orderNumber, status);
    const updated = await storage.getOrderByNumber(orderNumber);
    res.json(updated);
  });

  // ---- Analytics ----
  // Resolve a ?range= window (7d / 30d / 90d / all) to a since-timestamp.
  function rangeToSince(range: unknown): number {
    const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    if (range === "all") return 0;
    const d = typeof range === "string" && days[range] ? days[range] : 30;
    return Date.now() - d * 24 * 60 * 60 * 1000;
  }

  // KPI summary + behavior funnel + orders-by-status in one call.
  app.get("/api/admin/analytics/summary", requireAdmin, async (req, res) => {
    const since = rangeToSince(req.query.range);
    const [summary, funnel, byStatus] = await Promise.all([
      storage.analyticsSummary(since),
      storage.behaviorFunnel(since),
      storage.ordersByStatus(),
    ]);
    res.json({ summary, funnel, ordersByStatus: byStatus });
  });

  // Daily revenue + order count time series.
  app.get("/api/admin/analytics/timeseries", requireAdmin, async (req, res) => {
    const since = rangeToSince(req.query.range);
    res.json(await storage.salesTimeseries(since));
  });

  // Best-selling products by revenue.
  app.get("/api/admin/analytics/top-products", requireAdmin, async (req, res) => {
    const since = rangeToSince(req.query.range);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    res.json(await storage.topProducts(since, limit));
  });

  // Raw recent events feed (for the clickstream table / CSV export).
  app.get("/api/admin/analytics/events", requireAdmin, async (req, res) => {
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 200));
    res.json(await storage.recentEvents(limit));
  });

  return httpServer;
}
