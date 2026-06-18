# Production Checklist

## Security
- [ ] Generate a strong `AUTH_SECRET` (`openssl rand -base64 32`) — do **not** ship the dev default.
- [ ] Set `NEXTAUTH_URL` to the real HTTPS domain.
- [ ] Keep `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-side only (no `NEXT_PUBLIC_`).
- [ ] Every server action calls `requireUserId()` and scopes queries by `userId` (verified).
- [ ] Add rate limiting to `POST /api/coach` (e.g. Upstash Ratelimit) to control AI spend.
- [ ] Review CORS / headers; add a CSP if embedding third-party media.

## Database
- [ ] Switch Prisma datasource to `postgresql`.
- [ ] Use a **pooled** connection string on serverless.
- [ ] Run `prisma migrate deploy` in the deploy pipeline.
- [ ] Seed only the library in prod (skip the demo user) or gate it behind an env flag.
- [ ] Set up automated backups.

## Performance (Lighthouse 95+ target)
- [x] Server Components for data-heavy pages; client islands only where interactive.
- [x] `next/font` self-hosts Inter + Sora (no layout shift).
- [x] Charts and dialogs are client-split and lazy by route.
- [x] `next/image` for all remote/photo media.
- [ ] Add real OG images + favicons/app icons in `/public`.
- [ ] Audit bundle (`@next/bundle-analyzer`) if adding heavy deps.

## Correctness
- [x] `npm run build` passes (type-check + lint + 16 routes).
- [x] Auth login flow verified end-to-end (csrf → callback → session → protected route).
- [x] Coach API streams personalized replies from live user data.
- [ ] Add unit tests for `src/lib/fitness.ts` (BMR/TDEE/macros/projection).
- [ ] Add E2E smoke tests (Playwright) for onboarding → log → dashboard.

## UX & accessibility
- [x] Dark & light mode.
- [x] Mobile-first responsive (bottom nav + desktop sidebar).
- [x] Skeleton loading, empty states, confetti (respects reduced motion).
- [ ] Run an a11y audit (axe) and fix contrast/labels as needed.

## Observability
- [ ] Add error tracking (Sentry) and analytics (PostHog/Vercel Analytics).
- [ ] Log/track AI token usage and cost per user.

## Notifications (future)
- [ ] Reminders are modeled (`Reminder`) and toggleable but not dispatched — wire a
      cron + web-push / email provider to actually send them.

## Business (future)
- [ ] Wire Stripe for the Pro plan (pricing UI already exists on the landing page).
