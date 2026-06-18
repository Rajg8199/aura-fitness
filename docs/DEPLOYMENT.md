# Deployment Guide (Vercel + Postgres)

## Overview
Local dev runs on SQLite with zero config. For production, deploy to **Vercel** with a
managed **Postgres** database (Neon, Supabase, or Vercel Postgres).

## 1. Switch the datasource to Postgres
In `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 2. Provision Postgres
Pick one:
- **Neon** — create a project, copy the pooled connection string.
- **Supabase** — Project → Settings → Database → Connection string (and you get Storage too).
- **Vercel Postgres** — add from the Vercel dashboard; env vars are injected automatically.

## 3. Push the schema + seed
```bash
# with DATABASE_URL pointing at Postgres
npx prisma migrate deploy      # or: npx prisma db push
npm run db:seed                # optional — seeds library + demo data
```
> For real production you may want to seed only the **library** (exercises, foods,
> plans, achievements) and skip the demo user. Split the seed if desired.

## 4. Configure environment variables on Vercel
| Variable | Value |
| --- | --- |
| `DATABASE_URL` | your Postgres connection string (use the **pooled** URL on serverless) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-domain.com` |
| `ANTHROPIC_API_KEY` | your Claude key (optional but recommended) |
| `AI_COACH_MODEL` | `claude-opus-4-8` (or `claude-sonnet-4-6` for lower cost) |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | if using Supabase Storage for photos |

## 5. Deploy
```bash
# Option A: Git
git init && git add . && git commit -m "Aura"   # push to GitHub, then "Import Project" on Vercel

# Option B: CLI
npm i -g vercel && vercel
```
The `build` script runs `prisma generate && next build`, so the Prisma Client is always
generated in CI.

## 6. Connection pooling (important on serverless)
Each serverless invocation can open a DB connection. Use a **pooled** connection string
(Neon/Supabase provide one; or use PgBouncer). The Prisma client is already a singleton
(`src/lib/prisma.ts`) to avoid exhausting connections in dev.

## 7. Progress photos (optional Supabase Storage)
Without Supabase configured, photos are stored as local data URLs (fine for demo). For
production, create a public `progress-photos` bucket and wire uploads to Supabase Storage
in `addProgressPhoto`.

## 8. Custom domain & HTTPS
Add your domain in Vercel → it provisions TLS automatically. Update `NEXTAUTH_URL`.

## Build commands reference
| Setting | Value |
| --- | --- |
| Install | `npm install` |
| Build | `npm run build` |
| Output | `.next` (Vercel auto-detects Next.js) |
| Node | 20+ |
