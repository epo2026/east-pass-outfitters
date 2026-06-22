import { products, orders } from "@shared/schema";
import type { Product, InsertProduct, Order, InsertOrder } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, sql } from "drizzle-orm";
import { seedProducts } from "./seed";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Ensure tables exist (lightweight migration for the sandbox)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    species TEXT,
    apparel_category TEXT,
    brand TEXT NOT NULL,
    price REAL NOT NULL,
    compare_at_price REAL,
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    sizes TEXT,
    colors TEXT,
    tags TEXT,
    rating REAL NOT NULL DEFAULT 4.7,
    review_count INTEGER NOT NULL DEFAULT 0,
    in_stock INTEGER NOT NULL DEFAULT 1,
    is_custom INTEGER NOT NULL DEFAULT 0,
    is_dropship INTEGER NOT NULL DEFAULT 0,
    bestseller INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping REAL NOT NULL,
    tax REAL NOT NULL,
    total REAL NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite);

export interface IStorage {
  listProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createOrder(order: InsertOrder & { orderNumber: string; createdAt: number }): Promise<Order>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
}

export class DatabaseStorage implements IStorage {
  async listProducts(): Promise<Product[]> {
    return db.select().from(products).all();
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return db.select().from(products).where(eq(products.slug, slug)).get();
  }

  async createOrder(
    order: InsertOrder & { orderNumber: string; createdAt: number }
  ): Promise<Order> {
    return db.insert(orders).values(order).returning().get();
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).get();
  }
}

export const storage = new DatabaseStorage();

// Seed products once on boot if the table is empty
const count = db.select({ c: sql<number>`count(*)` }).from(products).get();
if (!count || count.c === 0) {
  for (const p of seedProducts) {
    db.insert(products).values(p).run();
  }
  console.log(`Seeded ${seedProducts.length} products.`);
}
