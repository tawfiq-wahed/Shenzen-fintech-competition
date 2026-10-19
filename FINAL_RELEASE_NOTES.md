# EasyBiz AI — Final usability release

## What's new
- Personal details: separate **owner photo** stored on the user profile; shop photo remains independent and continues to appear in sidebar shop branding. JPG/PNG/WebP data URLs under 220 KB supported.
- Sales: **Quick Sale** and **Bill / Memo** modes. Bill mode requires a customer name; phone and address are optional. Successful bill sales generate a printable customer-facing receipt; purchase costs and internal profit are never printed.
- Inventory: **Remove** action archives products without destroying historical financial records. Products with remaining stock cannot be archived.
- Purchases and sales: quantity fields show the product's unit, including pcs, kg, g, liter, ml, box, dozen, pack, meter and other. Decimal quantities to three places are accepted for measured goods. The product's inventory unit is canonical: do not mix a box with pieces for the same product unless you explicitly convert before entry.
- Financial integrity: the existing server-calculated FIFO cost, 20%-of-positive-gross-profit discount, and business-scoped records are preserved.

## Running locally
1. Keep your existing `server/.env` (do not overwrite it); ensure `PORT=5001`, a 32+ character JWT secret and a MongoDB replica-set connection.
2. `cd server && npm install && npm test && npm run dev`
3. In another terminal: `cd client && npm install && npm run build && npm run dev`
4. Test profile photo, inventory archive, purchase, quick sale, bill/memo, and printing.

## Limitations / production work
- The bill is a simple sales memo, not a jurisdiction-certified VAT/tax invoice. Add required tax registration, tax calculations and legal fields before using as a formal tax invoice.
- No unit conversion engine: a product's selected unit applies to purchase and sale. Use distinct product SKUs for different packaging or convert manually before entering stock.
- Product archiving is blocked when stock remains. There is no dedicated inventory adjustment workflow yet.
- The printable memo uses the browser's Print / Save as PDF feature.
- Uploads are small embedded images; production should use authenticated object storage, image re-encoding and malware scanning.
- End-to-end browser testing and production build are not verified in this environment; `npm install` timed out. Backend syntax and 5 existing unit tests passed. Test on your own Mac before submission.
- Rotate any JWT secret previously shared, never commit `.env` or API keys, and use HTTPS in production.
