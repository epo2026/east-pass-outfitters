import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { storage } from "./storage";
import { checkoutSchema } from "@shared/schema";

function genOrderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `EPO-${n}`;
}

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

  app.post("/api/checkout", async (req, res) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid checkout details", errors: parsed.error.flatten() });
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

  return httpServer;
}
