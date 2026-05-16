# ClearPost

Canadian hiring compliance SaaS for Ontario's Working for Workers Acts. Tracks
pay transparency, AI disclosure, vacancy disclosure, the 45-day candidate
notification deadline, and 3-year record retention.

## Stack

- Next.js 15 (App Router) + TypeScript strict
- Supabase (Auth + Postgres, ca-central-1)
- Drizzle ORM
- Tailwind CSS + shadcn/ui (deep teal `#0f766e` accent)
- next-intl (English active; French scaffolded for v2)
- Stripe (CAD) — wiring to come
- Resend — wiring to come

## Local development

```bash
cp .env.example .env.local   # fill in Supabase + Stripe + Resend
npm install --legacy-peer-deps
npm run dev
```

Then open <http://localhost:3000>.

### Demo mode vs live mode

The `/app/*` workspace runs in **demo mode** by default — it reads the
seeded dataset in `src/lib/demo/data.ts` so the deployed preview shows a
complete product without any infrastructure configured.

Demo mode auto-activates when **either** of these is missing:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`

To switch to **live mode**:

1. Provision a Supabase project in the `ca-central-1` region.
2. Apply the schema and RLS policies:
   ```bash
   psql "$DATABASE_URL" -f drizzle/0000_init.sql
   psql "$DATABASE_URL" -f drizzle/0001_rls.sql
   ```
3. (Optional) Seed the demo dataset into the live DB:
   ```bash
   npm run db:seed
   ```
4. Set `CLEARPOST_DEMO_MODE=false` in Vercel + restart.

Drizzle's iterative workflow is available via:

```bash
npm run db:generate   # diff schema → drizzle/*.sql
npm run db:push       # apply to DATABASE_URL
npm run db:studio     # web UI for the data
```

## Deploying to Vercel

1. Push this branch and connect the repo in the Vercel dashboard.
2. Add the environment variables from `.env.example`.
3. Use Supabase's `ca-central-1` region for Postgres and Storage.
4. Vercel will auto-build with `next build`.

The marketing landing page at `/` (hero, 6-question quiz, pricing, FAQ,
footer) renders without any of the backend env vars set — so a first
Vercel preview works out of the box.

## Project layout

```
src/
  app/                        # App Router
    page.tsx                  # Marketing landing
    (auth)/{login,signup}/    # Email + Google OAuth
    onboarding/               # Org creation (province + size)
    app/                      # Authenticated workspace shell
    auth/callback/route.ts    # Supabase OAuth callback
  components/
    marketing/                # Landing-page sections
    ui/                       # shadcn primitives
  lib/
    auth/actions.ts           # Server actions for sign in/up/out
    orgs/actions.ts           # createOrganization
    db/schema.ts              # Drizzle schema (full spec)
    supabase/{client,server}  # SSR-aware Supabase clients
    compliance/jurisdictions  # Typed rules engine
i18n/                         # next-intl request config
messages/en.json              # English copy
```

## Not legal advice

ClearPost surfaces obligations and statute citations. It is not a substitute
for HR counsel. Every regulatory output ends with a clear reminder.
