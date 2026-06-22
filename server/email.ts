// ---------------------------------------------------------------------------
// Transactional email via Resend (order confirmations).
//
// ENV-GATED: if RESEND_API_KEY is unset, sendOrderConfirmation is a no-op so
// the app keeps working in the sandbox and demo deployments.
// ---------------------------------------------------------------------------
import { Resend } from "resend";
import type { Order } from "@shared/schema";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.ORDER_FROM_EMAIL || "East Pass Outfitters <orders@eastpassoutfitters.com>";

export const emailEnabled = Boolean(RESEND_API_KEY);

const resend = emailEnabled ? new Resend(RESEND_API_KEY as string) : null;

const money = (n: number) => `$${n.toFixed(2)}`;

interface LineItem {
  name: string;
  qty: number;
  price: number;
  size?: string;
  color?: string;
}

function renderEmail(order: Order): string {
  let items: LineItem[] = [];
  try {
    items = JSON.parse(order.items);
  } catch {
    items = [];
  }

  const rows = items
    .map((i) => {
      const variant = [i.size, i.color].filter(Boolean).join(" / ");
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e8e2d6;">
            <strong style="color:#1f2d23;">${i.name}</strong>
            ${variant ? `<br><span style="color:#7a7363;font-size:13px;">${variant}</span>` : ""}
            <br><span style="color:#7a7363;font-size:13px;">Qty ${i.qty}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e8e2d6;text-align:right;color:#1f2d23;">
            ${money(i.price * i.qty)}
          </td>
        </tr>`;
    })
    .join("");

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f3ec;padding:32px;">
    <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #e8e2d6;border-radius:12px;overflow:hidden;">
      <div style="background:#1f2d23;padding:24px 32px;">
        <h1 style="margin:0;color:#f6f3ec;font-size:20px;letter-spacing:0.04em;">EAST PASS OUTFITTERS</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 4px;color:#1f2d23;font-size:18px;">Thanks for your order, ${order.firstName}.</h2>
        <p style="margin:0 0 24px;color:#7a7363;font-size:14px;">
          Order <strong style="color:#1f2d23;">${order.orderNumber}</strong> is confirmed and being prepared.
        </p>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;color:#1f2d23;">
          <tr><td style="padding:4px 0;color:#7a7363;">Subtotal</td><td style="padding:4px 0;text-align:right;">${money(order.subtotal)}</td></tr>
          <tr><td style="padding:4px 0;color:#7a7363;">Shipping</td><td style="padding:4px 0;text-align:right;">${order.shipping === 0 ? "Free" : money(order.shipping)}</td></tr>
          <tr><td style="padding:4px 0;color:#7a7363;">Tax</td><td style="padding:4px 0;text-align:right;">${money(order.tax)}</td></tr>
          <tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #e8e2d6;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #e8e2d6;">${money(order.total)}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e8e2d6;color:#7a7363;font-size:13px;">
          <strong style="color:#1f2d23;">Shipping to</strong><br>
          ${order.firstName} ${order.lastName}<br>
          ${order.address}<br>
          ${order.city}, ${order.state} ${order.zip}
        </div>
        <p style="margin:24px 0 0;color:#7a7363;font-size:12px;">
          Questions? Reply to this email or reach us at eastpassoutfitters@gmail.com.
        </p>
      </div>
    </div>
  </div>`;
}

export async function sendOrderConfirmation(order: Order): Promise<void> {
  if (!resend) return; // no-op when email is not configured
  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed - East Pass Outfitters`,
    html: renderEmail(order),
  });
}
