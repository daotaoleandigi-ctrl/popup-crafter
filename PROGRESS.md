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

## Live service state
- .env.local contains the user-provided Supabase Project URL and publishable key; it is ignored by git.
- Auth settings endpoint returned HTTP 200: email enabled, signup enabled, email confirmation required.
- Both 001 and 002 migrations have been applied successfully to the real project. Public RPC returns 200; anonymous table reads are denied.
- User signed into dashboard; SQL setup completed using SQL Editor.
- Live SQL transaction with two synthetic users passed isolation, stale revision rejection, draft/publication separation and unpublish. Rollback confirmed no test users or popup remained.
- Site URL set to http://127.0.0.1:8080 for current testing. Replace/add production domain when deploying.
- No frontend deployment or VITE_APP_URL configured yet. Do not hand out localhost embed codes for production websites.

## Verification
- 13 tests passed: storage, import validation, widget runtime, cloud loader, login gate, PostgreSQL RLS/publication/image-folder restrictions.
- Application TypeScript, ESLint and production build pass.
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
