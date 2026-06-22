import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PRODUCTS
// type: "apparel" | "tackle"
// For tackle, `species` is one of: inshore | offshore | pelagic | piersurf
// For apparel, `apparelCategory` is one of: shirts | hats | outerwear | accessories
// `tags` and `sizes` are stored as JSON text columns (SQLite has no array type).
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "apparel" | "tackle"
  species: text("species"), // tackle only
  apparelCategory: text("apparel_category"), // apparel only
  brand: text("brand").notNull(),
  price: real("price").notNull(),
  compareAtPrice: real("compare_at_price"),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  sizes: text("sizes"), // JSON array of strings (apparel)
  colors: text("colors"), // JSON array of strings (apparel)
  tags: text("tags"), // JSON array of strings
  rating: real("rating").notNull().default(4.7),
  reviewCount: integer("review_count").notNull().default(0),
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  isDropship: integer("is_dropship", { mode: "boolean" }).notNull().default(false),
  bestseller: integer("bestseller", { mode: "boolean" }).notNull().default(false),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ORDERS
// items stored as JSON text: [{ productId, name, price, qty, size, color, image }]
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  items: text("items").notNull(), // JSON
  subtotal: real("subtotal").notNull(),
  shipping: real("shipping").notNull(),
  tax: real("tax").notNull(),
  total: real("total").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

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
