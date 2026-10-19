# EasyBiz AI — Final security and usability upgrade

## Included
- OpenAI Responses API backend integration (optional, requires OPENAI_API_KEY and billing); no browser-side API key; read-only AI answers grounded in business-scoped facts; local fallback.
- Business-specific authorization for workspace endpoints (retained), cookie request header + origin checks, rate limits, JWT session version invalidation on password change.
- Shop photo in sidebar shop identity, not a replacement of the product brand; simple login with show/hide password and Framer Motion.
- Inventory category dropdown and unit dropdown (pcs, kg, g, liter, ml, pack, box, dozen, meter, other).
- Calendar-aware 90-day historical cash movement forecast with weekday patterns, capped recent-sales trend, and low-data confidence warnings. Not a true bank balance forecast.
- Existing FIFO inventory, multi-item purchases/sales, profit-based discounts, dashboard, financing calculator and audit logs preserved.

## Setup
1. Extract and open `easybiz-ai`.
2. `cd server && cp .env.example .env` and edit .env. Set MONGODB_URI, JWT_SECRET (use `openssl rand -hex 32`), CLIENT_ORIGIN and optional OPENAI_API_KEY. Never commit .env.
3. MongoDB needs an initialized replica set (e.g. `?replicaSet=rs0`) for purchase/sale transactions.
4. `npm install && npm test && npm run dev` in server; `npm install && npm run build && npm run dev` in client.
5. Test signup, shop creation, purchases, sales, discounts, cash flow and AI against a test database.

## Limitations and security work still needed
- This is a hackathon prototype, not audited production finance software.
- Origin + custom-header checks protect normal browser cross-origin requests, but a dedicated CSRF-token mechanism is recommended for production.
- Currency is currently stored as floating-point Number; migrate to integer poisha/Decimal128 with migration and regression tests before production use.
- Duplicate purchase/sale retries are not idempotent. Implement request idempotency keys and unique indexes before real payment integrations.
- Forecast has no true collection schedules, bank balances, supplier terms, holidays or demand seasonality. Do not claim guaranteed future cash or loan eligibility.
- Product quantities currently require integers, so kg/liter must be entered as whole units until fractional-quantity stock math is implemented.
- AI facts are limited to supplied verified aggregates; it cannot access private bank accounts or execute business transactions.
- Uploaded shop photo uses a small base64 image stored in MongoDB; use object storage and scanning for production.
- Password reset, MFA, backups, vulnerability scanning, HTTPS deployment, full integration tests and accessibility audit are pending.
- Source and tests should be verified on the target machine before competition submission.
