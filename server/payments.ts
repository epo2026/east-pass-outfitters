// ---------------------------------------------------------------------------
// Stripe payment integration (production path).
//
// Everything here is ENV-GATED: if STRIPE_SECRET_KEY is not set, the module
// reports `stripeEnabled === false` and the rest of the app falls back to the
// demo checkout. This keeps the sandbox preview working without live keys.
//
// Security model:
//   * We use Stripe Checkout Sessions (hosted redirect) so card data never
//     touches our server -> SAQ A scope.
//   * Prices are RE-VALIDATED server-side from the database. We never trust the
//     price the client sends.
//   * Orders are fulfilled ONLY on a verified `checkout.session.completed`
//     webhook event, never on the browser success redirect.
//   * Webhook signatures are verified with the raw request body.
//   * Event IDs are recorded in a processed-events ledger so Stripe retries are
//     idempotent and an order is never fulfilled twice.
// ---------------------------------------------------------------------------
import Stripe from "stripe";
import type { Request } from "express";
import { storage } from "./storage";
import type { CartItem, Order } from "@shared/schema";
import { sendOrderConfirmation } from "./email";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:5000";
const AUTOMATIC_TAX = process.env.STRIPE_AUTOMATIC_TAX === "true";

export const stripeEnabled = Boolean(STRIPE_SECRET_KEY);

const stripe = stripeEnabled
  ? new Stripe(STRIPE_SECRET_KEY as string, { apiVersion: "2026-05-27.dahlia" })
  : null;

const FREE_SHIPPING_THRESHOLD = 75;
const FLAT_SHIPPING = 7.95;

/**
 * Re-price a cart from authoritative DB data and return validated line items
 * plus the trusted subtotal. Throws if any product is missing or out of stock.
 */
async function repriceCart(items: CartItem[]) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const validatedItems: Array<CartItem & { price: number }> = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await storage.getProductById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (!product.inStock) {
      throw new Error(`${product.name} is out of stock`);
    }
    const qty = Math.max(1, Math.floor(item.qty));
    // TRUST THE DATABASE PRICE, not the client.
    const unitAmount = Math.round(product.price * 100);
    subtotal += product.price * qty;

    const desc = [item.size, item.color].filter(Boolean).join(" / ");
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        product_data: {
          name: product.name,
          description: desc || undefined,
        },
        tax_behavior: AUTOMATIC_TAX ? "exclusive" : undefined,
      },
    });
    validatedItems.push({
      ...item,
      price: product.price,
      qty,
      name: product.name,
      image: product.image,
    });
  }

  return { lineItems, validatedItems, subtotal: +subtotal.toFixed(2) };
}

export interface CreateSessionArgs {
  items: CartItem[];
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  orderNumber: string;
}

/**
 * Create a Stripe Checkout Session for a freshly-created pending order.
 * Returns the hosted checkout URL the client should redirect to.
 */
export async function createCheckoutSession(args: CreateSessionArgs): Promise<{
  url: string;
  sessionId: string;
  subtotal: number;
  shipping: number;
}> {
  if (!stripe) throw new Error("Stripe is not configured");

  const { lineItems, subtotal } = await repriceCart(args.items);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
    {
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: shipping === 0 ? "Free shipping" : "Standard shipping",
        fixed_amount: { amount: Math.round(shipping * 100), currency: "usd" },
        delivery_estimate: {
          minimum: { unit: "business_day", value: 3 },
          maximum: { unit: "business_day", value: 7 },
        },
      },
    },
  ];

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    // Omit payment_method_types so Stripe shows all enabled methods
    // (cards, Apple Pay, Google Pay, Link) automatically.
    line_items: lineItems,
    customer_email: args.customer.email,
    client_reference_id: args.orderNumber,
    metadata: { orderNumber: args.orderNumber },
    shipping_options: shippingOptions,
    success_url: `${PUBLIC_URL}/#/order/${args.orderNumber}?status=success`,
    cancel_url: `${PUBLIC_URL}/#/checkout?status=cancelled`,
  };

  if (AUTOMATIC_TAX) {
    params.automatic_tax = { enabled: true };
  }

  const session = await stripe.checkout.sessions.create(params, {
    // Idempotency: retrying with the same order number never creates a
    // duplicate session/charge.
    idempotencyKey: `checkout_${args.orderNumber}`,
  });

  return {
    url: session.url as string,
    sessionId: session.id,
    subtotal,
    shipping,
  };
}

/**
 * Parse an order's stored items JSON into productId/qty pairs. Orders persist
 * their line items as a JSON text column, so we decode defensively.
 */
function parseOrderLineItems(order: Order): Array<{ productId: number; qty: number }> {
  let items: unknown = (order as any).items;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(items)) return [];
  return items
    .map((it: any) => ({
      productId: Number(it?.productId),
      qty: Math.max(0, Math.floor(Number(it?.qty) || 0)),
    }))
    .filter((it) => Number.isFinite(it.productId) && it.productId > 0 && it.qty > 0);
}

/**
 * Adjust inventory for every line item in an order. Positive `direction`
 * restocks; negative decrements. Failures are logged but never block the
 * webhook acknowledgement (Stripe retries are handled by idempotency).
 */
async function applyInventoryChange(order: Order, direction: 1 | -1): Promise<void> {
  for (const { productId, qty } of parseOrderLineItems(order)) {
    try {
      await storage.adjustStock(productId, direction * qty);
    } catch (e) {
      console.error(`Inventory adjust failed for product ${productId}:`, e);
    }
  }
}

/**
 * Verify and handle a Stripe webhook. Express must expose the raw request body
 * on `req.rawBody` (the template's express.json verify callback does this).
 */
export async function handleWebhook(req: Request): Promise<{ received: true }> {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook is not configured");
  }

  const signature = req.headers["stripe-signature"];
  const raw = (req as any).rawBody as Buffer | undefined;
  if (!raw) throw new Error("Missing raw request body for signature verification");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      signature as string,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const e = err as Error;
    const verifyError = new Error(`Webhook signature verification failed: ${e.message}`);
    (verifyError as any).statusCode = 400;
    throw verifyError;
  }

  // Idempotency: if we've already processed this event, short-circuit.
  if (await storage.eventAlreadyProcessed(event.id)) {
    return { received: true };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderNumber =
        session.metadata?.orderNumber || (session.client_reference_id as string);
      if (orderNumber && session.payment_status === "paid") {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        await storage.markOrderPaid(orderNumber, paymentIntentId);
        const order = await storage.getOrderByNumber(orderNumber);
        if (order) {
          // Decrement inventory now that payment is confirmed.
          await applyInventoryChange(order as Order, -1);
          await sendOrderConfirmation(order as Order).catch((e) =>
            console.error("Order confirmation email failed:", e),
          );
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = intent.metadata?.orderNumber;
      if (orderNumber) {
        await storage.markOrderStatus(orderNumber, "payment_failed");
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const orderNumber = charge.metadata?.orderNumber;
      if (orderNumber) {
        await storage.markOrderStatus(orderNumber, "refunded");
        const order = await storage.getOrderByNumber(orderNumber);
        if (order) {
          // Return the refunded units to inventory.
          await applyInventoryChange(order as Order, 1);
        }
      }
      break;
    }
    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }

  await storage.recordProcessedEvent(event.id, event.type);
  return { received: true };
}
