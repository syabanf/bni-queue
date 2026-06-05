# BNI NatCon Digital Passport & Stamp System

Web app for the BNI National Conference digital passport: QR-based stamp collection at booths, real-time public leaderboard, LED display mode, management dashboard, raffle management, and exportable reports.

Stack:

- **Frontend**: Next.js 16 (App Router, React 19), TypeScript, Tailwind v4
- **Database / Auth / Realtime**: Supabase (Postgres + Auth + Realtime)
- **QR scanner**: `@zxing/browser`
- **QR token**: HMAC-SHA256 opaque string
- **Theme**: WIT.ID dark-first system (lime accent on near-black)

Design and architecture rationale lives in [the implementation plan](~/.claude/plans/users-syabanf-downloads-bni-natcon-digi-abundant-moth.md) (Claude Code plan file).

## Local setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template and fill in Supabase credentials + QR secret
cp .env.example .env.local

# 3. Apply database migrations to your Supabase project
#    (recommended: Supabase CLI — `npx supabase link` then `npx supabase db push`)
#    Alternative for dev: paste supabase/migrations/0001_initial_schema.sql into the SQL editor.

# 4. Run the dev server
pnpm dev
```

Open <http://localhost:3000>. Anonymous traffic redirects to `/leaderboard`.

## Project structure

```
app/
  (public)/      # Anonymous: /leaderboard, /leaderboard/display, /booths, /raffle-status
  (booth)/      # Booth PIC role: /booth/login, /booth/scanner, ...
  (admin)/      # Admin/Management/Display Operator: /admin/*
  api/          # Route handlers (scan, manual, QR, exports)
components/    # scanner, leaderboard, admin, shared, ui
lib/
  supabase/    # server.ts, browser.ts, service-role.ts (server-only)
  auth/        # rbac, session guards, signin/signout actions
  qr/          # HMAC sign + verify, QR render
  realtime/
  reports/
  utils/       # cn, masking, time (Asia/Jakarta)
config/        # design-tokens.ts (shared by Tailwind + Recharts)
supabase/
  migrations/  # 0001_initial_schema.sql — single source of truth
types/         # database.ts (regenerate via supabase gen types)
```

## Roles

- `super_admin`, `event_admin` → full admin access
- `management_viewer` → read-only admin
- `booth_pic` → scanner only, scoped to assigned booths via `booth_assignments`
- `display_operator` → LED display controls only

Roles + booth assignments are mirrored from `public.users` + `public.booth_assignments` into `auth.users.raw_app_meta_data` via DB triggers, so RLS can read claims directly from `auth.jwt()` without a DB join at request time.

**Booth PIC accounts**: create through the admin UI (week 3). Initially, you can bootstrap a Super Admin by inserting an `auth.users` row via the Supabase Dashboard and then a matching `public.users` row with `role = 'super_admin'`.

## Key invariants

- `UNIQUE (participant_id, booth_id) WHERE voided_at IS NULL` on `stamps` — the load-bearing duplicate-prevention constraint. Application code MUST attempt the insert and catch `unique_violation` (no pre-check; that's a TOCTOU race).
- `scan_attempts` is append-only and includes every scan including duplicates and invalids. Idempotency via `(scanned_by, client_request_id)` unique partial index.
- Booth PICs have NO direct `SELECT` on `participants`. They call `lookup_participant_for_scan(qr_token, qr_version)` (SECURITY DEFINER) which returns only first name + last initial + city + chapter + current stamp count.
- Service-role key is server-only. Never import `lib/supabase/service-role.ts` from a Client Component.

## Demo mode (build-now, wire-later)

The app ships fully navigable **without** a database. When `BNI_DEV_AUTH=true`
(and `NODE_ENV !== production`), the login screens show "Sign in as <role>"
shortcuts that set a dev-session cookie, and every query function serves
in-repo mock data (`lib/dev/*`). Mutations are blocked with a "Demo mode" notice.

This is controlled centrally by `isMockMode()` in `lib/data/mode.ts`. In
production with real Supabase + real auth, it always returns false, so the live
query/write path runs — **no code changes needed to go live**.

## Going to production

1. **Create a Supabase project.** Note the Project URL, anon key, and
   service-role key (Project Settings → API).
2. **Enable extensions** (Database → Extensions): `pgcrypto`, `citext`,
   and `pg_cron` (for the leaderboard refresh job).
3. **Run migrations in order** via the SQL editor or `npx supabase db push`:
   - `0001_initial_schema.sql` — tables, enums, RLS, triggers, materialized view
   - `0002_lookup_by_code.sql` — manual-input lookup function
   - `0003_admin_summary_views.sql` — admin list views
4. **Set environment variables** (`.env.local` locally, project env in Vercel):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   QR_HMAC_SECRET=<openssl rand -base64 48 | tr -d '\n=' | tr '+/' '-_'>
   NEXT_PUBLIC_SITE_URL=https://your-domain
   ```
   ⚠️ **Remove / unset `BNI_DEV_AUTH`.** While it is `true`, the app stays in
   demo mode (mock data, dummy logins) **even with real Supabase creds** —
   `isMockMode()` is gated on that flag, not on `NODE_ENV`.
5. **Bootstrap a Super Admin:** run [`supabase/seed.sql`](supabase/seed.sql) in
   the SQL editor. Option A (recommended): create the user in Dashboard →
   Authentication → Add user (auto-confirm), set the email/name at the top of
   the file, then run it to promote that user to `super_admin`. The DB trigger
   mirrors the role into JWT claims on next sign-in. After that, create all
   other staff via **Admin → Users**.
6. **Deploy to Vercel** (or any Node host). `pnpm build` must pass (it does).
7. **Verify** the Settings page shows "Supabase configured: Yes" and
   "Current data source: Live Supabase".

`/admin/settings` surfaces the current backend status at a glance.

## Implemented surfaces

- **Public**: `/leaderboard` (podium + ranking + booth imagery),
  `/leaderboard/display` (fullscreen auto-rotating LED), `/booths`,
  `/raffle-status`
- **Booth PIC**: `/booth/scanner` (camera + manual + idempotent scan),
  `/booth/my-visitors`, `/booth/scan-history`, `/booth/profile`
- **Admin**: overview, participants (+ import + QR), cities, chapters, booths,
  users, stamp monitoring, leaderboard (unmasked), raffle (settings → draw →
  lock), reports (xlsx/csv export ×7), settings
- **APIs**: `/api/stamps/scan`, `/api/stamps/manual(/validate)`,
  `/api/qr/[code]`, `/api/reports/[type]/export`

## Roadmap

All MVP surfaces are built and the production build is green. Remaining
pre-launch work (per the implementation plan): connect a live Supabase project,
load-test the scan path, and the optional offline-queue (Phase 5).
