# Security self-assessment (development MVP, not independent audit)

| Area | Implemented | Remaining risk / next action |
|---|---|---|
| Authentication | bcrypt hashes, signed HTTP-only session cookie | Add MFA, session revocation and password reset |
| Authorization | business membership check on every workspace API | Add explicit write-role policies and cross-tenant automated tests |
| Input validation | Zod on writes, Mongoose validation | Fuzz-test edge cases; add output encoding review |
| Data integrity | MongoDB transactions for stock and sales; FIFO batch allocation | Add idempotency keys, refund/reversal workflows and ledger reconciliation |
| Transport | Helmet; secure cookie in production | HTTPS termination and reverse proxy configuration |
| Abuse | rate limiting | Add CSRF protection, bot controls, monitoring |
| Secrets | server-side .env and optional Qwen key | Secret rotation and vault in production |
| Privacy | AI receives aggregate monthly figures only | Retention policy, data subject requests, jurisdiction review |
| Audit | basic create/update events | Immutable external logs, alerting and event completeness |
| Financing | clearly illustrative comparisons | Integrate licensed lenders and verified offers only with approvals |

Never use with real customer data until independent security and regulatory review.
