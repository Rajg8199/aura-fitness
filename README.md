<div align="center">

# ⚡ Aura — AI Fitness Coach

**A premium, production-ready fitness platform.** Track workouts, nutrition, and progress, get coached by AI, and stay motivated — built to compete with MyFitnessPal, Fitbod, Hevy, and Apple Fitness.

Next.js 15 · TypeScript · Tailwind · Prisma · NextAuth · Claude AI · Recharts · Framer Motion

</div>

---

## ✨ Features

| Module | What it does |
| --- | --- |
| **Onboarding** | Multi-step wizard → auto-calculates BMI, BMR, TDEE, target calories & macros (Mifflin-St Jeor) |
| **Dashboard** | Apple-style activity rings, calorie/macro/water progress, weight trend, streaks, weekly goal |
| **Workouts** | 28-exercise library, auto-generated plans (Full Body, PPL, Upper/Lower, Arnold), guided session player with rest timer, set logging & completion celebration |
| **Nutrition** | Macro-aware food diary, food search, custom foods, suggested meal plan, interactive water tracker |
| **Progress** | Weight log + projection, body measurements, progress photos, before/after slider |
| **AI Coach** | ChatGPT-style streaming chat powered by Claude (with a smart offline fallback) |
| **Gamification** | XP, levels, daily streaks, 14 achievements/badges |
| **Analytics** | Calorie/protein/macro/weight/workout-frequency trends + muscle-group distribution |
| **Settings** | Edit profile & goals (auto-recalculates targets), reminders, dark/light theme |

Plus: glassmorphism, smooth Framer Motion animations, dark & light mode, mobile-first responsive design, skeleton loading, empty states, confetti, progress rings, and floating actions.

---

## 🚀 Quick start (zero config)

Runs locally with **no external accounts** — SQLite database + offline AI coach.

```bash
# 1. Install
npm install

# 2. Create the database + seed demo data
npm run setup            # = prisma db push && tsx prisma/seed.ts

# 3. Run
npm run dev
```

Open **http://localhost:3000** and sign in with the demo account:

```
Email:    demo@aura.fit
Password: demo1234
```

> The demo user comes pre-loaded with 30 days of weight history, today's meals, water, completed workouts, a 5-day streak, and unlocked achievements.

---

## 🔑 Environment variables

Copy `.env.example` → `.env`. Sensible defaults are already provided.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | `file:./dev.db` (SQLite) by default. Swap to a Postgres URL for production. |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32`. A dev default is provided. |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` in dev; your domain in prod. |
| `ANTHROPIC_API_KEY` | ➖ | Leave blank to use the offline rule-based coach. Add a key to enable Claude. |
| `AI_COACH_MODEL` | ➖ | Defaults to `claude-opus-4-8`. |
| `NEXT_PUBLIC_SUPABASE_URL` etc. | ➖ | Optional — progress photos fall back to local data URLs when unset. |

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run start` | Start the production server |
| `npm run setup` | Push schema + seed (first-time setup) |
| `npm run db:push` | Sync schema to the database |
| `npm run db:seed` | Seed exercises, foods, plans, achievements + demo user |
| `npm run db:reset` | Wipe + re-seed |
| `npm run db:studio` | Open Prisma Studio |

---

## 🗂 Project structure

```
aura-fitness/
├── prisma/
│   ├── schema.prisma          # 20+ models (Postgres-compatible)
│   └── seed.ts                # exercises, foods, plans, achievements, demo user
├── src/
│   ├── app/
│   │   ├── (marketing)/       # premium landing page
│   │   ├── (auth)/            # sign-in / sign-up
│   │   ├── onboarding/        # macro-calculating wizard
│   │   ├── (app)/             # authed shell: dashboard, workouts, nutrition,
│   │   │                      #   progress, coach, analytics, achievements, settings
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── coach/         # streaming Claude/mock coach endpoint
│   │   ├── layout.tsx
│   │   └── globals.css        # design tokens (light/dark), glassmorphism utils
│   ├── components/
│   │   ├── ui/                # shadcn-style primitives
│   │   ├── shared/            # rings, charts, theme, confetti, sidebar, topbar…
│   │   └── {dashboard,workouts,nutrition,progress,coach,settings,onboarding}/
│   ├── lib/                   # auth, prisma, fitness math, enums, coach, utils
│   └── server/
│       ├── queries.ts         # read helpers
│       ├── coach-context.ts   # builds AI coach context from user data
│       └── actions/           # server actions (tracking, workout, profile, …)
└── docs/                      # PRD, architecture, DB, API, deployment, checklist
```

---

## 🧮 The fitness engine

All calculations live in [`src/lib/fitness.ts`](src/lib/fitness.ts):

- **BMR** — Mifflin-St Jeor equation
- **TDEE** — BMR × activity factor (1.2–1.9)
- **Target calories** — TDEE adjusted by goal (e.g. −18% for weight loss)
- **Macros** — protein per kg bodyweight (goal-dependent), fat as % of calories, carbs fill the rest
- **Goal projection** — ETA from calorie delta (~7700 kcal/kg)
- **Weight trend** — linear regression (kg/week)
- **XP/levels** — quadratic XP curve

---

## 🚢 Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). TL;DR: push to GitHub → import to Vercel → set env vars → swap Prisma datasource to Postgres → deploy.

## 📚 Docs

- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture & UX Flow](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [API & Server Actions](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md)

---

<div align="center">
Built with ❤️ as a startup-ready SaaS reference.
</div>
# aura-fitness
