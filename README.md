# EasyBiz AI — SME Finance Copilot

A full-stack finance and inventory assistant for small and medium businesses, built for the **2026 Shenzhen International FinTech Competition**.

An owner records purchases, sales and expenses. EasyBiz computes real profit from FIFO stock costs, projects cash movement, compares loan scenarios, and answers questions through an AI Copilot that only sees verified, server-calculated numbers.

> **Status: hackathon prototype.** It is not audited accounting software and not a lender. See [Limitations](#limitations).

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Quick start (local)](#quick-start-local)
5. [Environment variables](#environment-variables)
6. [How profit is calculated](#how-profit-is-calculated)
7. [API reference](#api-reference)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Security notes](#security-notes)
11. [Limitations](#limitations)
12. [Further documentation](#further-documentation)

---

## Features

- **Accounts and one shop per owner.** Register, sign in, complete a one-time shop setup. Owner photo and shop photo supported.
- **Inventory.** Products with category, unit (pcs, kg, g, liter, ml, box, dozen, pack, meter, other), low-stock threshold, and archive (blocked while stock remains).
- **Purchases.** Multi-item stock purchases that create FIFO batches at the actual unit cost.
- **Sales.** Quick Sale or Bill/Memo mode (customer name required for a bill, with a printable receipt). Payment methods: cash, bank, mobile, credit. Optional discount of 0–20%.
- **Expenses.** Operating expenses feed net profit.
- **Dashboard.** Daily, weekly, monthly and yearly views of sales, purchases, COGS, discount, gross profit and net profit, plus inventory value and low-stock alerts.
- **Cash Flow.** 90-day history and a scenario projection (up to 90 days) using weekday patterns and a capped recent-sales trend, with a confidence label.
- **Financing calculator.** Amortized monthly payment, total repayment and interest (illustrative only).
- **AI Copilot.** Gemini or OpenAI answers grounded in business facts. Falls back to deterministic local answers when no key is set or the provider fails.
- **Audit log.** Create, update and archive events (owner/admin only).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Tailwind CSS 3, React Router 7, Recharts, Framer Motion, Axios |
| Backend | Node.js 22, Express 4, Zod, bcryptjs, jsonwebtoken, Helmet, express-rate-limit |
| Database | MongoDB 6+/7 (Mongoose 8). **Must be a replica set** (Atlas works) |
| AI (optional) | Google Gemini API or OpenAI Responses API |

## Project structure

```
.
├── client/                  React SPA (Vite)
│   └── src/
│       ├── pages/           Auth, Setup, Dashboard, Workspace, CashFlow, Profile
│       ├── components/      Layout, BusinessGate
│       ├── context/         AuthContext
│       └── services/        api.js (Axios, baseURL /api), hooks.js
├── server/
│   ├── src/
│   │   ├── index.js         App setup, security middleware, rate limits
│   │   ├── config/db.js     MongoDB connection
│   │   ├── middleware/      auth.js (JWT cookie check)
│   │   ├── models/          User, Business, BusinessMember, Commerce
│   │   └── routes/          auth, businesses, health, workspace
│   ├── tests/               finance.test.js, decision.test.js
│   └── .env.example
├── ARCHITECTURE.md
├── SECURITY_SELF_ASSESSMENT.md
└── package.json             Root helper scripts
```

---

## Quick start (local)

### Prerequisites

- **Node.js 22 LTS** and npm
- **A MongoDB replica set.** Purchases and sales use transactions, which a standalone `mongod` does not support. Pick one:
  - **MongoDB Atlas free tier** (recommended, replica set built in), or
  - **Local replica set via Docker:**
    ```bash
    docker run -d --name easybiz-mongo -p 27017:27017 mongo:7 --replSet rs0
    docker exec easybiz-mongo mongosh --eval "rs.initiate()"
    ```
    Then use `MONGODB_URI=mongodb://localhost:27017/easybiz?replicaSet=rs0`.

### 1. Clone

```bash
git clone https://github.com/tawfiq-wahed/Shenzen-fintech-competition.git
cd Shenzen-fintech-competition
```

### 2. Configure the server

```bash
cd server
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `server/.env` (see [Environment variables](#environment-variables)). Generate a fresh JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install and run

Terminal 1 (API, port **5001**):

```bash
cd server
npm install
npm run dev
```

Terminal 2 (frontend, port **5173**):

```bash
cd client
npm install
npm run dev
```

Or install both at once from the repo root and run them together:

```bash
npm install                 # installs concurrently
npm run install:all
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to `http://localhost:5001`.

### 4. Verify it works

```bash
curl http://localhost:5001/api/health
# {"status":"ok","app":"EasyBiz - AI","database":"connected","timestamp":"..."}
```

Then in the browser: **Register → create your shop → add products → record a purchase → record a sale → open Dashboard.**

---

## Environment variables

Set these in `server/.env`. This file is git-ignored; never commit it.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5001` | API port. Keep `5001` locally; the Vite proxy expects it. |
| `MONGODB_URI` | **Yes** | none | MongoDB replica-set connection string. |
| `JWT_SECRET` | **Yes** | none | At least 32 random characters. The server refuses to start otherwise. |
| `CLIENT_ORIGIN` | Yes in production | `http://localhost:5173` | Exact frontend origin (scheme + host + port, no trailing slash). Used for CORS and the origin check on writes. |
| `NODE_ENV` | No | none | Set to `production` to mark the session cookie `Secure` (HTTPS only). |
| `GEMINI_API_KEY` | No | none | Enables Gemini for the Copilot. Get one in [Google AI Studio](https://aistudio.google.com/app/apikey). |
| `GEMINI_MODEL` | No | `gemini-3.5-flash` | Override if the model is retired. |
| `OPENAI_API_KEY` | No | none | Used only when no Gemini key is set. |
| `OPENAI_MODEL` | No | `gpt-4.1-mini` | OpenAI model name. |

Use placeholders in `server/.env.example`, for example `JWT_SECRET=replace_with_64_hex_chars` and `GEMINI_API_KEY=your_key_here`. Never put real values in the example file.

Provider keys belong on the server only. Do not put them in Vite (`VITE_*`) variables.

---

## How profit is calculated

All figures are computed on the server and stored as snapshots on each sale.

| Term | Definition |
|---|---|
| **Sales** | Sum of pre-discount sale subtotals in the period. |
| **Stock purchases** | Total of purchases recorded in the period. Not an expense; it does not reduce profit until the stock is sold. |
| **COGS** | FIFO cost of the units actually sold (oldest batch first). |
| **Discount** | Chosen rate (0–20%) × `max(0, subtotal − COGS)`. A loss-making sale gets no discount. |
| **Gross profit** | Sales − discount − COGS. |
| **Net profit** | Gross profit − operating expenses. |

Periods are calendar periods in the **server's timezone** (set `TZ`, for example `TZ=Asia/Dhaka`). Credit sales count as sales when recorded, not when paid; Cash Flow excludes them from cash received.

---

## API reference

Base URL: `/api`. Session is an HTTP-only cookie named `easybiz_session`. Any non-GET request that carries the cookie must also send the header `x-easybiz-request: 1` (the bundled client does this). The workspace is resolved from the signed-in user's membership, so no business header is needed.

**Auth** (rate limit: 30 requests / 15 min)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{name, email, password}` (password 8–128 chars) |
| POST | `/auth/login` | `{email, password}` |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/profile` | `{name?, photo?}` (photo is a PNG/JPEG/WebP data URL) |
| POST | `/auth/change-password` | Invalidates existing sessions |
| POST | `/auth/logout` | |

**Business**

| Method | Path | Notes |
|---|---|---|
| GET / POST | `/businesses` | One shop per account (second create returns 409) |
| GET | `/businesses/:id` | Member only |
| PATCH | `/businesses/mine` | Name, type, photo |
| GET | `/businesses/mine/profile` | |

**Workspace** (sign-in required; 120 requests/min)

| Method | Path | Notes |
|---|---|---|
| GET / POST | `/workspace/products` | |
| PATCH / DELETE | `/workspace/products/:id` | DELETE archives; 409 if stock remains |
| GET / POST | `/workspace/purchases` | `{supplier, items:[{product, quantity, unitCost}]}` |
| GET / POST | `/workspace/sales` | `{items:[{product, quantity, unitPrice}], discountRate, paymentMethod, saleMode, customer}` |
| GET / POST | `/workspace/expenses` | |
| GET | `/workspace/dashboard?period=daily\|weekly\|monthly\|yearly` | |
| GET | `/workspace/insights` | Top sellers and most profitable products |
| GET | `/workspace/cashflow?days=7..90` | History and scenario projection |
| GET | `/workspace/financing` | Illustrative options |
| POST | `/workspace/financing/compare` | `{principal, annualRate, months}` |
| POST | `/workspace/copilot` | `{question}` (8 requests/min) |
| GET | `/workspace/audit` | Owner or admin only |

**Health:** `GET /api/health`

---

## Testing

### 1. Automated unit tests

```bash
cd server
npm test
```

This runs Node's built-in test runner (`node --test`) on `server/tests/`. Expected result: **5 tests, 5 pass.**

| File | Test | What it checks |
|---|---|---|
| `finance.test.js` | zero-interest financing | `12000 / 12 months at 0% = 1000` |
| `finance.test.js` | positive APR payment | Payment exceeds `principal / months` |
| `finance.test.js` | loss-making sale | Discount is `0` when gross is negative |
| `decision.test.js` | 20% of gross profit | Sales 440, COGS 310 → discount 26, total 414, gross profit 104 |
| `decision.test.js` | no discount on loss | `max(0, 100 − 120) × 0.2 = 0` |

> **Note:** these tests re-implement the formulas inline rather than importing the route code, so they confirm the intended math but would not catch a regression in `workspace.js`. Extracting the finance helpers into a module and importing them in the tests is the recommended next step.

### 2. Manual end-to-end test cases

Use a **fresh test database**. Expected values are worked out by hand from the rules above.

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| E2E-01 | Register and shop setup | Register, then create a shop (BDT). | Redirected to Dashboard. A second shop creation returns 409. |
| E2E-02 | Create product | Add "Rice", unit `pcs`, sell price 80. | Product listed with stock 0. |
| E2E-03 | Two purchases | Buy 10 @ 50, then 10 @ 60. | Stock 20, inventory value 1,100, stock purchases 1,100. |
| E2E-04 | FIFO sale with discount | Sell 15 @ 80 with a 10% discount, cash. | COGS **800** (10×50 + 5×60). Pre-discount gross 400. Discount **40**. Total **1,160**. Gross profit **360**. Stock left: 5. |
| E2E-05 | Loss-making sale gets no discount | Sell 5 @ 40 with a 20% discount. | Remaining 5 units cost 60 each, so COGS 300, gross −100, discount **0**, total 200, gross profit **−100**. Stock 0. |
| E2E-06 | Insufficient stock | Try selling 1 more unit. | Rejected with "Insufficient stock" (409). |
| E2E-07 | Expense and net profit | Add a 100 expense. | Net profit for the period = gross profit − 100. |
| E2E-08 | Discount cap | Submit a sale with discount rate 25 (via API). | 400 validation error (max 20). |
| E2E-09 | Bill/Memo | Sale in Bill mode with no customer name. | Rejected. With a name, a printable receipt is shown and no cost or profit appears on it. |
| E2E-10 | Archive rule | Archive a product that still has stock. | Blocked (409). Archive works at zero stock and history is kept. |
| E2E-11 | Credit sale in Cash Flow | Record a credit sale, open Cash Flow. | Credit amount appears as an info alert and is excluded from cash received. |
| E2E-12 | Low-data warning | Open Cash Flow with under 14 active days. | Low-confidence warning is shown. |
| E2E-13 | Loan calculator | 100,000 at 12% APR for 12 months. | Monthly payment ≈ **8,884.88**, total ≈ 106,618.55, interest ≈ 6,618.55. |
| E2E-14 | Copilot fallback | Leave AI keys empty, ask "best selling products". | Local answer listing top products by units, `source: "local"`. |
| E2E-15 | Password change | Change password. | Signed out; old session rejected (401). |

### 3. API negative and security checks

Run with `curl` (Git Bash or WSL; in PowerShell use `curl.exe`). The server must be running.

```bash
# Health
curl -i http://localhost:5001/api/health                                # 200, database "connected"

# Unauthenticated access is blocked
curl -i http://localhost:5001/api/workspace/products                    # 401 Please sign in

# Weak password rejected
curl -i -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@example.com","password":"short"}'       # 400

# Valid registration, then duplicate email
curl -i -c jar.txt -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"t@example.com","password":"password123"}'   # 201, Set-Cookie
curl -i -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"t@example.com","password":"password123"}'   # 409

# CSRF-style protections on writes
curl -i -b jar.txt -X POST http://localhost:5001/api/workspace/expenses \
  -H "Content-Type: application/json" -d '{"title":"Rent","amount":100}'       # 403 (missing x-easybiz-request)
curl -i -b jar.txt -X POST http://localhost:5001/api/workspace/expenses \
  -H "Content-Type: application/json" -H "x-easybiz-request: 1" \
  -H "Origin: http://evil.example" -d '{"title":"Rent","amount":100}'          # 403 Origin not allowed

# Unknown route
curl -i http://localhost:5001/api/nope                                         # 404
```

| Check | Expected |
|---|---|
| Rate limit on `/api/auth` | 31st request within 15 minutes returns 429 |
| Copilot rate limit | 9th request within a minute returns 429 |
| `GET /api/workspace/audit` as `staff` or `viewer` | 403 |

---

## Deployment

The app is two parts: a Node API and a static React build. The session cookie is `SameSite=Lax`, so **the browser must see the frontend and `/api` on the same origin**. The deployment recipes below are built around that.

### Step 0: Database (MongoDB Atlas)

1. Create a free **M0** cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access:** create a user with a strong password (read/write on any database).
3. **Network Access:** allow your host's outbound IPs. Use `0.0.0.0/0` only for a quick demo, and tighten it afterwards.
4. **Connect → Drivers:** copy the connection string and add a database name:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/easybiz?retryWrites=true&w=majority
   ```
   Atlas is already a replica set, so transactions work. Do not add `replicaSet=rs0`.

### Option A: Render (API) + Vercel (frontend), recommended for a demo

**API on Render**

1. Push the repository to GitHub (make sure no secret is in the history).
2. In Render: **New → Web Service**, connect the repo.
3. Settings:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`
4. Environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your Atlas URI>
   JWT_SECRET=<fresh 64-hex string>
   CLIENT_ORIGIN=https://<your-vercel-domain>
   TZ=Asia/Dhaka
   GEMINI_API_KEY=<optional>
   ```
5. Add one line to `server/src/index.js` right after `const app=express();`, so rate limiting and secure cookies work behind Render's proxy:
   ```js
   app.set('trust proxy', 1);
   ```
6. Deploy, then confirm `https://<your-api>.onrender.com/api/health` returns `"database":"connected"`.

**Frontend on Vercel**

1. **New Project**, import the repo, set **Root Directory** to `client`.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. Add `client/vercel.json` so `/api` is proxied to the API. The browser then sees a single origin and the cookie works:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://<your-api>.onrender.com/api/:path*" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
4. Deploy, then copy the final Vercel URL into Render's `CLIENT_ORIGIN` (exactly, with no trailing slash) and redeploy the API.

> Render's free tier sleeps after inactivity, so the first request can take around a minute. Wake it before a live demo.

### Option B: Single VPS (Ubuntu) with Nginx and PM2

```bash
# 1. Runtime
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2

# 2. Code
git clone https://github.com/tawfiq-wahed/Shenzen-fintech-competition.git /var/www/easybiz
cd /var/www/easybiz/server && npm ci --omit=dev
nano .env        # production values (see table above), NODE_ENV=production
pm2 start src/index.js --name easybiz-api
pm2 save && pm2 startup

# 3. Frontend build
cd ../client && npm ci && npm run build      # creates client/dist
```

Nginx site (`/etc/nginx/sites-available/easybiz`):

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/easybiz/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/easybiz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com          # enables HTTPS
```

Set `CLIENT_ORIGIN=https://example.com`, add `app.set('trust proxy', 1);` as in Option A, and restart with `pm2 restart easybiz-api`.

### Post-deployment smoke test

1. `GET /api/health` returns `status: ok` and `database: connected`.
2. Register a new user in the browser; DevTools → Application → Cookies shows `easybiz_session` with **HttpOnly** and **Secure**.
3. Run E2E-02 to E2E-04 from the test table above. A correct FIFO result confirms transactions work on your database.
4. Ask the Copilot a question and check `source` is `gemini` (or `openai`), not `local`, if you configured a key.

### Production checklist

- [ ] HTTPS everywhere, `NODE_ENV=production`
- [ ] New `JWT_SECRET`, different from every example or previously shared value
- [ ] `CLIENT_ORIGIN` matches the live frontend exactly
- [ ] Atlas network access restricted; automated backups on
- [ ] Provider API keys restricted (API restriction in Google Cloud) and rotated if they were ever committed
- [ ] `.env` never committed; no secrets in `.env.example`

### Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `Set JWT_SECRET to at least 32 random characters` | Missing or short `JWT_SECRET`. |
| `Database startup failed` | Wrong `MONGODB_URI`, or the host IP is not allowed in Atlas Network Access. |
| `MongoDB transactions require Atlas or a replica set` | Standalone MongoDB. Use Atlas or start `mongod` with `--replSet`. |
| Login works but you are signed out on refresh | Cookie not stored: not on HTTPS with `NODE_ENV=production`, or frontend and API are on different origins (use the rewrite or Nginx setup). |
| `403 Origin not allowed` | `CLIENT_ORIGIN` does not exactly match the browser's origin. |
| `403 Request verification failed` | Non-GET request with the cookie but without header `x-easybiz-request: 1`. |
| `429 Too Many Requests` for all users behind a proxy | Missing `app.set('trust proxy', 1)`. |
| Copilot says it fell back to local calculations | Key invalid, quota reached, or `GEMINI_MODEL` retired. The error text is shown in `aiError`. |

---

## Security notes

Implemented: bcrypt password hashing (cost 12), HTTP-only SameSite session cookie with an 8-hour expiry, session invalidation on password change, Helmet, rate limiting, Zod validation on every write, per-business data isolation, Origin and custom-header checks on state-changing requests, MongoDB transactions with conditional FIFO decrements, and an audit trail.

The AI Copilot is read-only. It receives only aggregated, server-computed facts, is instructed to treat user text as untrusted, and cannot create or change records.

See [`SECURITY_SELF_ASSESSMENT.md`](SECURITY_SELF_ASSESSMENT.md) for the full self-assessment.

## Limitations

- Prototype only. Do not use with real customer data before an independent security and regulatory review.
- Money is stored as floating-point numbers (rounded to 2 decimals). Migrate to integer minor units or `Decimal128` before production.
- No idempotency keys: a retried purchase or sale request can be recorded twice.
- No refunds, returns, stock adjustments, password reset or MFA.
- Cash Flow is a scenario estimate. It does not track bank balances, supplier credit, credit collections, taxes, holidays or loan repayments, and it must not be presented as a bank-balance forecast.
- Financing figures are illustrative. There are no lender integrations, live rates or eligibility decisions.
- The bill/memo is not a tax-compliant invoice.
- No unit-conversion engine: each product has one unit, used for both purchase and sale.
- Product photos are stored as small base64 images in MongoDB (under about 250 KB).
- Role-based write permissions beyond the audit endpoint are not enforced.

## Further documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md): system flow and collections
- [`SECURITY_SELF_ASSESSMENT.md`](SECURITY_SELF_ASSESSMENT.md): controls and remaining risks
- [`FINAL_RELEASE_NOTES.md`](FINAL_RELEASE_NOTES.md), [`FINAL_UPGRADE_GUIDE.md`](FINAL_UPGRADE_GUIDE.md), [`UPGRADE_NOTES.md`](UPGRADE_NOTES.md), [`IMPROVEMENTS_AND_LIMITATIONS.md`](IMPROVEMENTS_AND_LIMITATIONS.md): release history (some older notes mention Qwen or OpenAI; the current code supports Gemini and OpenAI)

## License

No license file is included yet. Add one (for example MIT) before inviting reuse.