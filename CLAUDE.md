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

## Feedback → auto-task rule (ALWAYS run at session start)
At the start of every session, query the `feedback` table for items that have not yet had a task created:

```
GET https://dwhpszbluhjyrvwidwpi.supabase.co/rest/v1/feedback
  ?task_created=eq.false
  &select=id,category,message,created_at,users(name)
  &order=created_at.asc
Headers: apikey + Authorization (anon key from .env.local)
```

For each row returned, call TaskCreate with:
- title: "[Feedback] <category>: <first 60 chars of message>"
- details: full message + submitter name + date

After creating the task, mark it by PATCHing `task_created = true` on that row:
```
PATCH https://dwhpszbluhjyrvwidwpi.supabase.co/rest/v1/feedback?id=eq.<id>
Body: { "task_created": true }
Headers: apikey + Authorization (anon key from .env.local)
```

This is independent of `status` — Michael can mark feedback reviewed in the admin panel
at any time without affecting whether I've seen it. A task is only skipped once I've
explicitly set task_created = true.

## Vercel cron limit
Hobby plan allows max **one cron per day** per function. All schedules in `vercel.json` must use a daily-or-less pattern (e.g. `0 8 * * *`). Never use `*/15 * * * *` — it silently blocks all deployments.
