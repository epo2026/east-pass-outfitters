# East Pass Outfitters — Production Storefront Technical Design

Version 1.0 · Prepared for the East Pass Outfitters store rebuild
Stack: Vercel-hosted React/Express app · Stripe Checkout · Neon Postgres · Resend

---

## 1. Purpose & scope

This document describes how the existing demo storefront becomes a production-grade
e-commerce store that can take real payments, persist real orders, calculate tax,
and notify customers. It covers the target architecture, the third-party API
integrations, the data model, the payment and fulfillment flows, a PCI-DSS
compliance checklist, and the migration steps to get there.

**Design principles**

1. **Card data never touches our servers.** We use Stripe's hosted Checkout (a
   full-page redirect), which keeps the store in the lowest PCI scope (SAQ A).
2. **Money is decided server-side.** Prices are re-validated from the database on
   every checkout; the browser-supplied price is never trusted.
3. **Orders are fulfilled only on a verified webhook**, never on the browser
   success redirect, which can be spoofed or abandoned.
4. **Everything is idempotent.** Session creation uses idempotency keys; webhook
   processing is guarded by a processed-events ledger so Stripe retries can never
   fulfill an order twice.
5. **Graceful degradation.** Every external integration is environment-gated. With
   no keys configured, the app falls back to the existing demo flow so previews
   keep working.

---

## 2. Target architecture

```
Shopper browser (React SPA)
        │ HTTPS
        ▼
Vercel ── Static assets / CDN (prebuilt SPA bundle)
      └── Express API (serverless functions)
              ├── POST /api/checkout/session   → create Stripe session
              ├── POST /api/stripe/webhook      → fulfill order (source of truth)
              ├── GET  /api/products, /orders
              ├── server-side price re-validation
              └── webhook signature verification
        │ SQL (pooled, sslmode=require)        │ create session / receive webhook
        ▼                                        ▼
Neon Postgres (orders, processed_events)      Stripe (hosted Checkout, Tax, webhooks)
                                                 │ send
                                                 ▼
                                              Resend (order confirmation email)
```

See the **architecture diagram** and **checkout/webhook sequence diagram** shared
alongside this document for the visual version.

### 2.1 Components

| Component | Role | Technology |
|---|---|---|
| Frontend | Storefront SPA: catalog, cart, checkout form | React + Vite, Tailwind, shadcn/ui, TanStack Query |
| API | Order creation, payment session, webhook, admin reads | Express (deployed as Vercel serverless) |
| Database | Persistent orders + webhook idempotency ledger | Neon serverless Postgres + Drizzle ORM |
| Payments | Card capture, tax, payment methods, webhooks | Stripe Checkout Sessions API |
| Email | Transactional order confirmations | Resend |
| Hosting | Static CDN + serverless API + env/secret management | Vercel |

### 2.2 Why Stripe Checkout (not Payment Intents / Elements)

Stripe's own guidance is to use **Checkout Sessions** for new integrations rather
than building a custom card form on Payment Intents; Checkout handles payment
method management, SCA/3-D Secure, tax, and the UI for you
([Stripe: Checkout vs Payment Intents](https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison)).
The full-page hosted redirect also keeps card data entirely off our infrastructure,
which is the single biggest PCI scope reducer (SAQ A vs SAQ A-EP — see §6).

---

## 3. Third-party API integrations (itemized)

### 3.1 Payment processing — Stripe

| Capability | API | Notes |
|---|---|---|
| Create payment | `POST /v1/checkout/sessions` (`mode: payment`) | Server creates session, returns hosted URL ([docs](https://docs.stripe.com/api/checkout/sessions/create)) |
| Card capture & SCA | Stripe-hosted Checkout page | 3-D Secure handled by Stripe |
| Payment methods | Omit `payment_method_types` | Stripe auto-shows cards, Apple Pay, Google Pay, Link |
| Idempotency | `Idempotency-Key` header on session create | Key = order number; retries never double-charge ([docs](https://docs.stripe.com/api/idempotent_requests)) |
| Fulfillment signal | Webhook `checkout.session.completed` | The authoritative "paid" event |
| Failure / refunds | Webhooks `payment_intent.payment_failed`, `charge.refunded` | Update order status |
| Signature verify | `stripe.webhooks.constructEvent(rawBody, sig, secret)` | Requires the **raw** request body ([docs](https://docs.stripe.com/webhooks/signature)) |

### 3.2 Tax calculation — Stripe Tax

Enable `automatic_tax: { enabled: true }` on the Checkout Session. Stripe Tax
computes the correct rate from the customer's address at checkout and reports
liability for filing ([Stripe Tax](https://docs.stripe.com/tax)). Line items must
carry `tax_behavior` and the business must register tax settings in the Stripe
dashboard. This is gated behind `STRIPE_AUTOMATIC_TAX=true` so it can be turned on
once tax registration is complete.

### 3.3 Order management — Neon Postgres

| Operation | Method |
|---|---|
| Create pending order | `createOrder()` (status `pending`) |
| Attach Stripe session | `setOrderStripeSession()` |
| Fulfill | `markOrderPaid()` (status `paid`, store payment intent id) |
| Failure/refund | `markOrderStatus()` |
| Admin list | `listOrders()` (most recent first) |
| Lookup | `getOrderByNumber()`, `getOrderBySessionId()` |
| Idempotency | `eventAlreadyProcessed()`, `recordProcessedEvent()` |

Neon requires the **pooled** connection string with `sslmode=require` for
serverless usage ([Neon on Vercel](https://vercel.com/marketplace/neon)).

### 3.4 Email notifications — Resend

| Email | Trigger |
|---|---|
| Order confirmation | After `markOrderPaid()` succeeds in the webhook handler |
| (Future) Shipping notification | When order status moves to `fulfilled` |
| (Future) Refund notice | On `charge.refunded` |

Sending is gated on `RESEND_API_KEY`; the sender domain must be verified in Resend
with SPF/DKIM records.

---

## 4. Data model

```ts
orders {
  id                      serial PK
  orderNumber             text unique         // EPO-NNNNNN
  email, firstName, lastName, address, city, state, zip
  items                   text (JSON)         // line items snapshot
  subtotal, shipping, tax, total              numeric
  status                  text default 'pending'  // pending → paid → fulfilled
                                                   //         ↘ payment_failed / refunded
  stripeSessionId         text                // set when session created
  stripePaymentIntentId   text                // set on fulfillment
  createdAt               bigint
}

processedEvents {                              // webhook idempotency ledger
  eventId      text PK                          // Stripe event.id
  type         text
  processedAt  bigint
}
```

The order **status lifecycle** is the backbone of fulfillment:
`pending → paid → fulfilled`, with `payment_failed` and `refunded` as terminal
branches.

---

## 5. Payment & fulfillment flow

### 5.1 Checkout (synchronous)

1. Browser submits cart + shipping details to `POST /api/checkout/session`.
2. API re-prices the cart by looking up each product's real price in the database
   (the client-supplied price is discarded), computes shipping (free ≥ $75, else
   $7.95), and inserts a **pending** order.
3. API creates a Stripe Checkout Session with `Idempotency-Key = checkout_{orderNumber}`,
   stores the session id on the order, and returns the hosted URL.
4. Browser is redirected to Stripe; the shopper enters card details on Stripe's
   page. We never see the card.

### 5.2 Fulfillment (asynchronous — the source of truth)

5. Stripe sends a signed `checkout.session.completed` webhook to
   `POST /api/stripe/webhook`.
6. API verifies the signature against the **raw** body using the webhook secret. A
   bad signature returns `400` so Stripe retries.
7. API checks the `processed_events` ledger; if the event id was already handled it
   returns `200` immediately (idempotent no-op).
8. API marks the order `paid`, records the payment intent id, records the event id,
   and triggers a Resend confirmation email.
9. API returns `200` so Stripe stops retrying.

`payment_intent.payment_failed` → status `payment_failed`.
`charge.refunded` → status `refunded`.

> The browser success redirect is **only** used to show the confirmation page. It
> is never the trigger for fulfillment, because redirects can be abandoned, retried,
> or forged.

---

## 6. PCI-DSS compliance checklist

By using Stripe's hosted Checkout (full redirect), the store qualifies for
**SAQ A** — the smallest self-assessment questionnaire (~22 questions), because no
card data is entered, processed, transmitted, or stored on our systems
([PCI scope reduction guide](https://quicktrustapp.com/blog/pci-dss-scope-reduction-guide)).
Embedding Stripe Elements or an iframe instead would move the store to **SAQ A-EP**
(~85–191 questions, quarterly ASV scans, script inventory and tamper-detection
requirements) ([headless commerce PCI scoping](https://www.no7software.co.uk/blog/pci-dss-4-headless-ecommerce-scoping)).
The redirect model is therefore a deliberate compliance choice.

**SAQ A checklist for this store:**

- [ ] All payment pages are fully hosted/served by Stripe (redirect Checkout) — no card fields in our DOM.
- [ ] The entire site is served over HTTPS/TLS; HTTP redirects to HTTPS.
- [ ] No cardholder data (PAN, CVV, expiry, track data) is ever stored, logged, or transmitted by our app or database.
- [ ] Stripe secret key and webhook secret are stored only as server-side environment variables (Vercel encrypted env vars) — never in client code or the repo.
- [ ] `STRIPE_SECRET_KEY` is never exposed to the frontend; only publishable keys (if ever needed) may reach the client.
- [ ] Webhook endpoint verifies every event's signature with the signing secret before acting.
- [ ] Strong, unique credentials and least-privilege access for Vercel, Neon, Stripe, and Resend dashboards; MFA enabled.
- [ ] Default vendor credentials are not used anywhere.
- [ ] Dependencies are patched; `npm audit` is run regularly and high/critical issues remediated.
- [ ] Access to the order database is restricted and the connection is TLS (`sslmode=require`).
- [ ] An incident-response contact and process exist for suspected compromise.
- [ ] Complete and submit the Stripe-provided SAQ A annually and after major changes.

> PCI scope is about where card data flows, not where orders are stored. Storing
> order metadata (names, addresses, totals, Stripe ids) in Neon is fine and does
> **not** expand PCI scope, because none of it is cardholder data.

---

## 7. Environment variables

| Variable | Purpose | Exposure |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe API auth | Server only |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures | Server only |
| `STRIPE_AUTOMATIC_TAX` | Toggle Stripe Tax (`true`/`false`) | Server only |
| `PUBLIC_URL` | Build success/cancel redirect URLs | Server only |
| `DATABASE_URL` | Neon pooled connection (`sslmode=require`) | Server only |
| `RESEND_API_KEY` | Transactional email auth | Server only |
| `ORDER_FROM_EMAIL` | Verified sender address | Server only |

When `STRIPE_SECRET_KEY` is unset the app automatically uses the demo checkout, so
previews and local development work without any secrets.

---

## 8. Migration steps

1. **Provision services**
   - Create a Stripe account; complete business + tax registration; note the secret key.
   - Create a Neon Postgres database (via the Vercel Neon integration); copy the pooled connection string.
   - Create a Resend account; verify the sending domain (SPF/DKIM).
2. **Move persistence to Postgres**
   - Swap the `better-sqlite3` Drizzle driver for `@neondatabase/serverless` + `drizzle-orm/neon-http`.
   - Run a Drizzle migration to create `products`, `orders`, and `processed_events` in Neon.
   - Seed the product catalog into Neon.
3. **Configure Stripe**
   - Add a webhook endpoint pointing at `https://<domain>/api/stripe/webhook`; subscribe to `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`; copy the signing secret.
   - Enable Stripe Tax (optional, gated by `STRIPE_AUTOMATIC_TAX`).
4. **Deploy to Vercel**
   - Set all environment variables in the Vercel project (encrypted).
   - Configure the Express API as serverless functions and the SPA as static output.
   - Enforce HTTPS and attach the custom domain.
5. **Verify in test mode**
   - Use Stripe test cards to run a full purchase; confirm the webhook fulfills the order and the confirmation email arrives.
   - Use the Stripe CLI to replay webhook events and confirm idempotency (duplicate events do not double-fulfill).
   - Confirm a forged/abandoned success redirect does **not** mark an order paid.
6. **Go live**
   - Switch to live Stripe keys, complete and file SAQ A, and monitor the first real orders.

---

## 9. Open items / future work

- Admin authentication for `GET /api/orders` (currently unauthenticated; protect before exposing publicly).
- Inventory decrement on fulfillment and out-of-stock handling.
- Shipping-rate integration (real carrier rates) and shipping/delivery notification emails.
- Reconcile Stripe Tax totals back onto the stored order after the webhook (the order tax is provisional at session creation).
- Rate limiting and bot protection on checkout endpoints.

---

## Sources

- Stripe — Checkout Sessions vs Payment Intents: https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison
- Stripe — Create a Checkout Session: https://docs.stripe.com/api/checkout/sessions/create
- Stripe — Webhook signature verification: https://docs.stripe.com/webhooks/signature
- Stripe — Idempotent requests: https://docs.stripe.com/api/idempotent_requests
- Stripe Tax: https://docs.stripe.com/tax
- PCI DSS scope reduction guide: https://quicktrustapp.com/blog/pci-dss-scope-reduction-guide
- Headless e-commerce PCI scoping (SAQ A vs A-EP): https://www.no7software.co.uk/blog/pci-dss-4-headless-ecommerce-scoping
- Neon on the Vercel Marketplace: https://vercel.com/marketplace/neon
