# Popup Crafter — 2026-09-07

## Implemented
- Supabase Auth: registration, login, password reset, logout, account-gated routes.
- Cloud draft persistence, per-owner RLS, revision checks preventing stale overwrites.
- Separate published snapshots with publish/unpublish RPCs and a public single-ID read API.
- Supabase Storage image uploads with owner-folder write policies, immutable public image URLs and 5 MB limit.
- Cloud embed loader fetches the published version by ID; generated runtime is built from shared source.
- Legacy local data and JSON backup import; JSON export remains available.
- Admin form preview and demo are sandboxed from authentication state.
- Updated Vite and React Router; npm audit reported zero vulnerabilities after upgrades.
- Cloudflare Pages & Functions Migration Phase 1 & 2: Added `functions/api/supabase/[[path]].js` proxy, `functions/api/public/popups/[id].js` public endpoint, Cloudflare workflow `.github/workflows/deploy-cloudflare.yml`, `public/_redirects` SPA fallback, `public/_routes.json`, and `wrangler` local dev script.
- Vitest suite expanded: 22 tests passing across 9 test files including dedicated Cloudflare Functions proxy & public RPC tests.

## Live service state
- `.env.local` contains Supabase credentials and `VITE_APP_URL`.
- Cloudflare Functions handles backend proxy and CORS isolation.
- `public/_redirects` configured with `/* /index.html 200` for SPA client routing on Cloudflare Pages.

## Verification
- 22 tests passed (Auth, Storage, Widget Runtime, Cloud Loader, Cloudflare Functions proxy/RPC).
- TypeScript, ESLint, production bundle (`npm run build`) pass cleanly.
- Login page visually inspected at localhost:8080.
- Database tests use PostgreSQL WASM with mocked Auth/Storage schemas, not the hosted Supabase database.

## Remaining integration work
- Configure production Supabase Site URL/redirect URLs and SMTP; local Site URL is ready.
- Verify two real accounts, confirmation emails, image storage and embeds on another website.
- Verify actual CRM submission/thank-you behavior; sandbox compatibility may vary.
- Configure HTTPS frontend hosting and VITE_APP_URL before distributing cloud embed scripts.
- See DEPLOYMENT.md for exact setup and data/backup limitations.

## Scope
Individual accounts own separate data. Shared workspaces/member invitations and lead analytics are not implemented. Images are public website assets. JSON backups do not include copies of externally hosted images. Server/Storage backups need an operational policy.
