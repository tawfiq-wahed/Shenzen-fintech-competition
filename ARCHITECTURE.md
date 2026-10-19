# Architecture

React SPA → Vite proxy `/api` → Express 5001 → MongoDB Atlas (replica set)

Auth (JWT HTTP-only cookie) → business membership middleware → workspace routes → Mongoose models

Inventory: Product catalog stores default sell price. Purchase creates Purchase and FIFO StockBatch with actual unit cost. Sale uses MongoDB transaction to consume batches, records allocations and immutable price/cost snapshots. Dashboard derives independent traditional purchase/sales activity and true product gross/net profit. Finance aggregates per-product sales and profitability. Optional Qwen endpoint receives limited verified monthly totals only.

Key collections: users, businesses, businessmembers, products, stockbatches, purchases, sales, expenses, audits.

Risk boundaries: No external bank feeds, no reconciliation or settlement, no ledger/tax module, no production financing decisions.
