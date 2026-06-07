# Findley Lake — Claude Instructions

## Deployment rule (ALWAYS follow)
Every deployment must go to **both** Vercel and GitHub, in this order:
1. `npx vercel@latest --prod` — deploy to production
2. `git push origin main` — keep GitHub in sync

Never deploy to one without the other. The Vercel CLI bypasses GitHub entirely, so a push to Vercel alone leaves the repo stale and CI out of date.

## Project overview
- **Stack:** Next.js 14 App Router · Supabase (auth + DB + RLS) · Tailwind CSS · Vercel
- **Monorepo root:** `C:\Users\Ace\PyCharmMiscProject\findley`
- **Live URL:** https://findleycal.com
- **Supabase project ID:** `dwhpszbluhjyrvwidwpi`

## Key commands
```bash
# Deploy (always run both)
npx vercel@latest --prod
git push origin main

# DB migrations
supabase db push

# Regenerate types after schema change
supabase gen types typescript --project-id dwhpszbluhjyrvwidwpi > src/lib/supabase/database.types.ts
# Then strip any trailing CLI update text appended after the closing `} as const`

# Build check before deploying
npm run build
```

## Role hierarchy
`admin` (Michael, Dick & Colleen branch) > `papa` > `principal` > `viewer`

- **admin** — can edit/cancel any booking including past ones; has papa-level booking override
- **papa** — can manage any booking; always wins room conflicts
- **principal** — can submit bookings; subject to waiver/bump logic
- **viewer** — read-only calendar access

## Vercel cron limit
Hobby plan allows max **one cron per day** per function. All schedules in `vercel.json` must use a daily-or-less pattern (e.g. `0 8 * * *`). Never use `*/15 * * * *` — it silently blocks all deployments.
