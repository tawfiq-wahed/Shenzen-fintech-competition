# EasyBiz AI — hackathon UI upgrade

- One shop per owner account. Returning users enter the dashboard automatically. First-time users complete setup once. Existing multi-shop accounts are not migrated; the first membership is used.
- Click the sidebar logo or top-right avatar for profile, shop photo (PNG/JPEG/WebP under 220 KB), shop name/type, account name and password.
- English-only financial dashboard, no Section A / Section B labels.
- Sidebar version footer removed. Responsive animated sidebar, page transitions, accessible focus styles and reduced-motion support.
- Backend remains on port 5001. Stock/sales transactions require MongoDB replica set.
- Install updated frontend dependencies with `npm install`.

## Hackathon readiness caveats

This is a development submission candidate, not a security-certified production deployment. Verify frontend build, MongoDB transaction flows, responsive screens, financial calculations and Qwen API access before submitting. AI endpoint returns a deterministic summary without QWEN_API_KEY. Demo video, deployment, formal security tests and actual lender integrations are separate submission tasks.
