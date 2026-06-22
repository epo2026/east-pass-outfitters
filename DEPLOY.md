# Deploying East Pass Outfitters

This guide takes you from the current codebase to a live, always-on store at
**https://www.eastpassoutfitters.com**, backed by a managed Postgres database.

**Hosting stack**
- **Render** — runs the Node/Express app as an always-on Web Service (no cold starts). ~$7/mo on the Starter plan.
- **Neon** — serverless Postgres. Generous free tier; upgrade later if traffic grows.
- **Your domain registrar** — where you point `eastpassoutfitters.com` at Render.

The code is already migrated to Postgres and ready. The only things you do by hand
are: create the two accounts, copy a connection string, push to GitHub, and add DNS records.

---

## Overview of the steps

1. Create a Neon Postgres database and copy its pooled connection string.
2. Put the code on GitHub.
3. Create the Render Web Service and set environment variables.
4. Create the database tables (`db:push`).
5. Point eastpassoutfitters.com at Render and let it issue SSL.
6. (Optional) Wire up Stripe live payments and Resend email.

Plan on ~30–45 minutes the first time.

---

## Step 1 — Create the Neon Postgres database

1. Go to [neon.tech](https://neon.tech) and sign up (GitHub or Google login is fine).
2. Click **New Project**.
   - **Name:** `east-pass-outfitters`
   - **Postgres version:** leave default (latest).
   - **Region:** pick the one closest to you — **AWS US East (Ohio)** is a good default for the Gulf Coast. Remember which region you chose; you'll match Render to it.
   - Click **Create Project**.
3. After it provisions, Neon shows a **Connection string**. Make sure the toggle is set to **Pooled connection** (the host will contain `-pooler`). It looks like:
   ```
   postgresql://neondb_owner:XXXXXXXX@ep-cool-name-12345-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copy this entire string and save it somewhere safe** — this is your `DATABASE_URL`. You'll paste it into Render in Step 3.

> Use the **pooled** string (the one with `-pooler`). The app uses the Neon serverless driver, which works best through the pooler.

---

## Step 2 — Put the code on GitHub

Render deploys from a Git repository. If the project isn't on GitHub yet:

1. Create an empty repo at [github.com/new](https://github.com/new) — e.g. `east-pass-outfitters`. Leave it empty (no README).
2. From the project folder on your computer, run:
   ```bash
   cd east-pass-outfitters
   git init                 # skip if already a git repo
   git add -A
   git commit -m "Initial deploy"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/east-pass-outfitters.git
   git push -u origin main
   ```

> `.env` is already git-ignored — your secrets never get pushed. Good.

---

## Step 3 — Create the Render Web Service

1. Go to [render.com](https://render.com) and sign up. Connect your GitHub account when prompted.
2. Click **New +** → **Web Service**.
3. Select your `east-pass-outfitters` repository.
4. Render auto-detects the included **`render.yaml`** blueprint. If it asks to use the Blueprint, accept it. Otherwise fill in manually:
   - **Name:** `east-pass-outfitters`
   - **Region:** the same region you picked for Neon (e.g. Ohio).
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** **Starter** (~$7/mo, always-on). The Free plan sleeps after inactivity and adds a cold-start delay — fine for testing, not for ads traffic.
5. Add **Environment Variables** (Render dashboard → your service → **Environment**). At minimum:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | the pooled Neon string from Step 1 |
   | `ADMIN_PASSWORD` | a strong password for your `/#/admin` login (change from the default) |
   | `ADMIN_TOKEN` | a long random string (e.g. run `openssl rand -hex 32`) |
   | `PUBLIC_URL` | `https://www.eastpassoutfitters.com` |
   | `NODE_VERSION` | `20` |

   Stripe and Resend keys are optional (see Step 6). Without `STRIPE_SECRET_KEY` the site uses a built-in demo checkout so you can test the full flow.

6. Click **Create Web Service**. Render builds and deploys. The first build takes a few minutes. When it's live you'll get a URL like `https://east-pass-outfitters.onrender.com`.

---

## Step 4 — Create the database tables

The app seeds its 22 products automatically on first boot, but the **tables** must exist first. Create them with Drizzle. Easiest path is from your own machine (one time):

1. Put the Neon string in a local `.env`:
   ```bash
   cd east-pass-outfitters
   echo 'DATABASE_URL=YOUR_NEON_POOLED_STRING' > .env
   ```
2. Push the schema:
   ```bash
   npm install
   npm run db:push
   ```
   This creates the `products`, `orders`, `events`, and `processed_events` tables in Neon. Answer "yes" to any prompts.
3. Delete the local `.env` afterward if you don't want the string sitting on disk (it's git-ignored regardless).

Now restart the Render service (Render → **Manual Deploy** → **Clear build cache & deploy**, or just **Deploy latest commit**). On boot, `ensureSeed()` populates the 22 products. Visit your `onrender.com` URL — the storefront should show products, and `/#/admin` should let you log in with `ADMIN_PASSWORD`.

> Alternative: you can also run `npm run db:push` from Render's **Shell** tab (Starter plan includes shell access) so you never touch the DB locally.

---

## Step 5 — Point eastpassoutfitters.com at Render

1. In Render: your service → **Settings** → **Custom Domains** → **Add Custom Domain**.
2. Add **both**:
   - `www.eastpassoutfitters.com`  (primary — matches `PUBLIC_URL`)
   - `eastpassoutfitters.com`  (root/apex — Render will redirect it to `www`)
3. Render shows you the DNS records to create. Typically:
   - For **`www`**: a **CNAME** record →
     ```
     Type: CNAME   Host: www   Value: east-pass-outfitters.onrender.com
     ```
   - For the **root/apex** (`eastpassoutfitters.com`): Render gives you either an **A record** (an IP like `216.24.57.1`) or an **ALIAS/ANAME** target. Use whichever Render shows. If your registrar supports ALIAS/ANAME flattening, use that pointing at the onrender hostname; otherwise use the A record IP Render provides.
4. Log in to **your domain registrar** (where you bought eastpassoutfitters.com — GoDaddy, Namecheap, Google Domains/Squarespace, Cloudflare, etc.) and open its **DNS** settings.
5. Add the records exactly as Render listed them. Delete any conflicting old `A`/`CNAME` records for `@` or `www` (e.g. a parking page).
6. Back in Render, the custom domains will show **Verifying** → **Issued** once DNS propagates (minutes to a couple hours). Render **auto-provisions a free SSL certificate** — no action needed.

Once verified, https://www.eastpassoutfitters.com serves your store with HTTPS.

> DNS tip: if you use **Cloudflare** as your DNS, set the records to **DNS only** (grey cloud) at first so Render can verify and issue SSL; you can enable the proxy later if you want.

---

## Step 6 — (Optional) Live payments and email

**Stripe (real card payments)**
1. In your [Stripe dashboard](https://dashboard.stripe.com), grab your **live** secret key (`sk_live_...`).
2. Create a webhook endpoint pointing at `https://www.eastpassoutfitters.com/api/stripe/webhook`, subscribe to `checkout.session.completed`, and copy its **signing secret** (`whsec_...`).
3. In Render → Environment, set:
   - `STRIPE_SECRET_KEY = sk_live_...`
   - `STRIPE_WEBHOOK_SECRET = whsec_...`
   - `STRIPE_AUTOMATIC_TAX = false` (set `true` only after enabling Stripe Tax)
4. Redeploy. The checkout now uses real Stripe sessions instead of the demo flow.

**Resend (order confirmation emails)**
1. Sign up at [resend.com](https://resend.com), verify the `eastpassoutfitters.com` sending domain (add the DNS records they give you), and create an API key.
2. In Render → Environment, set:
   - `RESEND_API_KEY = re_...`
   - `ORDER_FROM_EMAIL = East Pass Outfitters <orders@eastpassoutfitters.com>`
3. Redeploy. Order confirmations will send automatically (it's a no-op if unset).

---

## Day-to-day after launch

- **Edit products / inventory / orders:** log into `https://www.eastpassoutfitters.com/#/admin` with your `ADMIN_PASSWORD`.
- **Deploy code changes:** push to the `main` branch on GitHub — Render auto-deploys (`autoDeploy: true` in `render.yaml`).
- **Schema changes:** if you change `shared/schema.ts`, run `npm run db:push` again against Neon.
- **Backups:** Neon keeps automatic point-in-time history; review retention on your plan.
- **Monitoring:** Render's dashboard shows logs, metrics, and deploy history. The health check hits `/api/config`.

---

## Quick reference — required environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Neon **pooled** connection string |
| `ADMIN_PASSWORD` | ✅ | Login for `/#/admin` |
| `ADMIN_TOKEN` | ✅ | Random secret for API automation |
| `PUBLIC_URL` | ✅ | `https://www.eastpassoutfitters.com` |
| `NODE_VERSION` | ✅ | `20` |
| `STRIPE_SECRET_KEY` | optional | Live payments; omit for demo checkout |
| `STRIPE_WEBHOOK_SECRET` | optional | Required if using Stripe |
| `STRIPE_AUTOMATIC_TAX` | optional | `false` unless Stripe Tax is set up |
| `RESEND_API_KEY` | optional | Order emails |
| `ORDER_FROM_EMAIL` | optional | From-address for emails |
