import { pgTable, text, integer, serial, boolean, doublePrecision, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PRODUCTS
// type: "apparel" | "tackle"
// For tackle, `species` is one of: inshore | offshore | pelagic | piersurf
// For apparel, `apparelCategory` is one of: shirts | hats | outerwear | accessories
// `tags` and `sizes` are stored as JSON text columns (pg has no array type constraint here).
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "apparel" | "tackle"
  species: text("species"), // tackle only
  apparelCategory: text("apparel_category"), // apparel only
  brand: text("brand").notNull(),
  price: doublePrecision("price").notNull(),
  compareAtPrice: doublePrecision("compare_at_price"),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  sizes: text("sizes"), // JSON array of strings (apparel)
  colors: text("colors"), // JSON array of strings (apparel)
  tags: text("tags"), // JSON array of strings
  rating: doublePrecision("rating").notNull().default(4.7),
  reviewCount: integer("review_count").notNull().default(0),
  inStock: boolean("in_stock").notNull().default(true),
  // INVENTORY
  // stockQty is the on-hand count. inStock is kept in sync automatically:
  // it flips to false when stockQty hits 0 and back to true when restocked.
  // lowStockThreshold drives the low-stock admin report.
  stockQty: integer("stock_qty").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  isCustom: boolean("is_custom").notNull().default(false),
  isDropship: boolean("is_dropship").notNull().default(false),
  bestseller: boolean("bestseller").notNull().default(false),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Admin product write payload. Everything is optional on update; arrays are
// accepted as real arrays and serialized to JSON text by the storage layer.
export const productWriteSchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(["apparel", "tackle"]).optional(),
  species: z.string().nullable().optional(),
  apparelCategory: z.string().nullable().optional(),
  brand: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  compareAtPrice: z.number().nonnegative().nullable().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  sizes: z.array(z.string()).nullable().optional(),
  colors: z.array(z.string()).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  stockQty: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  isCustom: z.boolean().optional(),
  isDropship: z.boolean().optional(),
  bestseller: z.boolean().optional(),
});
export type ProductWrite = z.infer<typeof productWriteSchema>;

// Stricter shape for CREATE: the fields a product can't exist without.
export const productCreateSchema = productWriteSchema.required({
  slug: true,
  name: true,
  type: true,
  brand: true,
  price: true,
  shortDescription: true,
  description: true,
  image: true,
});

// ORDERS
// items stored as JSON text: [{ productId, name, price, qty, size, color, image }]
// status lifecycle: "pending" -> "paid" -> "fulfilled" (or "payment_failed" / "refunded")
// Stripe fields are null until a Checkout Session is created (production payment path).
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  items: text("items").notNull(), // JSON
  subtotal: doublePrecision("subtotal").notNull(),
  shipping: doublePrecision("shipping").notNull(),
  tax: doublePrecision("tax").notNull(),
  total: doublePrecision("total").notNull(),
  status: text("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// PROCESSED WEBHOOK EVENTS — idempotency ledger so Stripe's retries never
// fulfill an order twice. We record each Stripe event.id the first time we
// successfully handle it; duplicates short-circuit.
export const processedEvents = pgTable("processed_events", {
  eventId: text("event_id").primaryKey(),
  type: text("type").notNull(),
  processedAt: bigint("processed_at", { mode: "number" }).notNull(),
});

// ANALYTICS EVENTS
// Lightweight clickstream/behavior log powering the dashboard analytics.
// `type` examples: page_view, product_view, add_to_cart, begin_checkout,
// purchase. `sessionId` groups events from one visitor session (in-memory on
// the client; no cookies). `productId` and `path` are optional context. `value`
// holds a numeric amount (e.g. order total on purchase) for revenue math.
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  sessionId: text("session_id"),
  path: text("path"),
  productId: integer("product_id"),
  value: doublePrecision("value"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type Event = typeof events.$inferSelect;

// Public tracking payload from the storefront.
export const trackEventSchema = z.object({
  type: z.enum([
    "page_view",
    "product_view",
    "add_to_cart",
    "begin_checkout",
    "purchase",
    "click",
  ]),
  sessionId: z.string().max(64).optional(),
  path: z.string().max(512).optional(),
  productId: z.number().int().optional(),
  value: z.number().nonnegative().optional(),
});
export type TrackEvent = z.infer<typeof trackEventSchema>;

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  status: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type ProcessedEvent = typeof processedEvents.$inferSelect;

// Cart item shape used on the frontend (client state, not persisted)
export const cartItemSchema = z.object({
  productId: z.number(),
  slug: z.string(),
  name: z.string(),
  price: z.number(),
  qty: z.number().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  image: z.string(),
  type: z.string(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

// Checkout payload from the client
export const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(3),
  items: z.array(cartItemSchema).min(1),
});
export type CheckoutPayload = z.infer<typeof checkoutSchema>;
