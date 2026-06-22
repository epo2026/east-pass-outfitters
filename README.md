# East Pass Outfitters

E-commerce storefront for East Pass Outfitters — a regional Emerald Coast (Pensacola, FL) outfitter selling original fishing/boating apparel and saltwater tackle organized by target species, plus charter booking. Includes a public storefront, cart and checkout (Stripe with a built-in demo fallback), order confirmation emails, and a password-protected admin dashboard for managing products, inventory, orders, and analytics.

Live admin dashboard: `/#/admin`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 |
| Server | Express 5 (TypeScript, run via `tsx`) |
| Frontend | React 18 + Vite 7 |
| Routing | wouter (hash-based routing for iframe/static-host compatibility) |
| Styling | Tailwind CSS v3 + shadcn/ui components |
| Data fetching | TanStack Query v5 |
| Database | PostgreSQL (Neon serverless) via Drizzle ORM + drizzle-kit |
| Payments | Stripe (`stripe` SDK) — falls back to a demo checkout when unconfigured |
| Email | Resend (transactional order confirmations) |
| Build | Vite (client) + esbuild (server bundle) → `dist/` |

The server and client run on a single port. In production the Express server serves the built static frontend and handles `/api/*` requests.

---

## Project Structure

```
client/        React frontend (pages, components, lib, public/img assets)
server/        Express app: index.ts, routes.ts, storage.ts, payments.ts, seed.ts
shared/        Drizzle schema + shared Zod types (used by client and server)
script/        build.ts (Vite client + esbuild server bundling)
migrations/    Generated Drizzle SQL migrations
drizzle.config.ts
render.yaml    Render deployment blueprint
DEPLOY.md      Full first-time deployment guide (Neon + Render + DNS)
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- A PostgreSQL connection string (a free [Neon](https://neon.tech) database works well)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy the example file and fill in your values:
```bash
cp .env.example .env
```
At minimum set `DATABASE_URL` (a Neon **pooled** connection string) and `ADMIN_PASSWORD`. Stripe and Resend keys are optional — without `STRIPE_SECRET_KEY` the app uses a built-in demo checkout flow. See `.env.example` for the full list.

### 3. Create the database tables
```bash
npm run db:push
```
This applies the Drizzle schema to your database. Products are auto-seeded on first server boot.

### 4. Start the dev server
```bash
npm run dev
```
The app runs on `http://localhost:5000` (Express + Vite on the same port). The frontend hot-reloads on save. The admin dashboard is at `http://localhost:5000/#/admin`.

### Useful scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server (Express + Vite) |
| `npm run build` | Build client + server into `dist/` |
| `npm run start` | Run the production build (`dist/index.cjs`) |
| `npm run check` | Type-check with `tsc` |
| `npm run db:push` | Push the Drizzle schema to the database |

---

## Deploying Updates (Render)

The app is hosted on **Render** as an always-on Node web service, backed by **Neon** Postgres. The repository includes a `render.yaml` blueprint that defines the build/start commands, health check, and environment variables.

### Continuous deployment
Render is connected to this GitHub repository with auto-deploy enabled. To ship a change:

1. Commit and push to the `main` branch:
   ```bash
   git add -A
   git commit -m "Describe your change"
   git push origin main
   ```
2. Render automatically detects the push, runs `npm install && npm run build`, and restarts the service with `npm run start`. Watch progress in the Render dashboard under **Events / Logs**.

The health check at `/api/config` must return 200 for a deploy to go live.

### Database schema changes
If you modify `shared/schema.ts`, push the updated schema to Neon after deploying:
```bash
npm run db:push   # run with DATABASE_URL pointing at the production Neon DB
```
You can also run this from Render's **Shell** tab so you never handle the production connection string locally.

### Environment variables
Secrets are configured in the Render dashboard (**Service → Environment**), not committed to the repo. Required: `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN`, `PUBLIC_URL`, `NODE_VERSION`. Optional: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_AUTOMATIC_TAX`, `RESEND_API_KEY`, `ORDER_FROM_EMAIL`. See `.env.example` and `render.yaml` for the full reference.

### First-time setup
For initial provisioning (creating the Neon database, the Render service, and pointing the `eastpassoutfitters.com` domain with SSL), follow the step-by-step guide in [`DEPLOY.md`](./DEPLOY.md).

---

## Admin Dashboard

Visit `/#/admin` and log in with `ADMIN_PASSWORD`. Tabs:
- **Products** — add, edit, and delete catalog items
- **Inventory** — adjust stock levels and view low-stock alerts
- **Orders** — review orders, expand line items, and update fulfillment status
- **Analytics** — revenue, conversion funnel, top products, and CSV export

---

## Notes

- Product images are served as optimized WebP from `client/public/img`.
- The app uses hash-based routing (`/#/route`) for compatibility with static/iframe hosting — keep this in mind when adding pages.
- Browser storage (`localStorage`, cookies) is intentionally avoided; transient state lives in React, and persistent data lives in Postgres via the API.
