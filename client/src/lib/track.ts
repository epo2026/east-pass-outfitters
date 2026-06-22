// Lightweight, fire-and-forget analytics tracking for the storefront.
//
// No cookies or localStorage (blocked in the sandboxed iframe), so the visitor
// "session id" lives in a module-level variable for the life of the page load.
// Events are POSTed to /api/track; failures are swallowed so tracking can never
// break the storefront.

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// Random per-page-load session id used to group a visitor's events.
const SESSION_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);

export type TrackType =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "click";

interface TrackOpts {
  path?: string;
  productId?: number;
  value?: number;
}

export function track(type: TrackType, opts: TrackOpts = {}): void {
  const body = JSON.stringify({
    type,
    sessionId: SESSION_ID,
    path: opts.path ?? (typeof window !== "undefined" ? window.location.hash || "/" : "/"),
    productId: opts.productId,
    value: opts.value,
  });
  try {
    // Prefer sendBeacon so events still fire during navigation/unload.
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(`${API_BASE}/api/track`, blob);
      return;
    }
    void fetch(`${API_BASE}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
