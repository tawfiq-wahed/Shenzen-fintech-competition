# EasyBiz AI — Finance Copilot Improvement Release

## Implemented improvements
- Existing two-panel dashboard preserved: Sales & Purchases and My Real Profit, each with daily/weekly/monthly/yearly views.
- New Cash Flow page with a transparent 30-day historical cash movement approximation and a 30-day scenario extrapolation. Credit sales are excluded from collected sales.
- New financing calculator with amortized monthly payment and total interest; illustrative only, not a real lender integration.
- Improved offline copilot: interprets questions about top sellers, most profitable products, discount policy, cash flow and loans using actual stored sales data; Qwen integration remains optional.
- Business workspace selection on API side now uses the signed-in user's first membership instead of accepting an arbitrary business header.
- Existing FIFO stock purchases/sales and 20%-of-positive-gross-profit discount rule preserved.

## Important limitations / do not overclaim
- Cash movement assumes recorded stock purchases and expenses are paid immediately; supplier credit, customer credit repayments, opening balances, bank balances, VAT and loan repayments are NOT tracked. This is not a reliable bank-balance forecast.
- Product rankings use up to 500 most recent sales, not necessarily full lifetime data.
- No actual lender offers, live interest rates, lending eligibility, credit scoring or bank connections.
- Qwen requires QWEN_API_KEY in server/.env. Without it, deterministic finance responses are provided.
- No claim of a fully tested deployment: run all browser workflows and production builds locally before submission.
- Local MongoDB must run as a replica set for purchase/sale transactions.
- No demo video, deck or competition execution evidence is included.

## Setup
1. cd server && cp .env.example .env (edit PORT=5001, MONGODB_URI and a NEW 32+ character JWT_SECRET)
2. npm install && npm test && npm run dev
3. In another terminal: cd client && npm install && npm run build && npm run dev
4. Open http://localhost:5173; create an account and shop; add products, buy stock, sell, check dashboard, Cash Flow, AI Copilot.
5. Never upload server/.env or real customer data to GitHub.
