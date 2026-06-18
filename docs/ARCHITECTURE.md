# Architecture, UX Flow & Component Design

## 1. High-level architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Client)                        │
│  React 19 client islands: charts, session player, chat,        │
│  water widget, wizard, dialogs — hydrated where interactive    │
└───────────────▲───────────────────────────────┬───────────────┘
                │ RSC payload / Server Actions    │ fetch (stream)
                │                                 ▼
┌───────────────┴───────────────────────────────────────────────┐
│                  Next.js 15 App Router (Server)                 │
│  • Server Components (data fetching via src/server/queries.ts)  │
│  • Server Actions (src/server/actions/*) — mutations            │
│  • Route Handlers: /api/auth (NextAuth), /api/coach (stream)    │
│  • Auth: NextAuth v5 credentials + JWT (src/lib/auth.ts)        │
└───────────────┬───────────────────────────────┬───────────────┘
                │ Prisma Client                   │ Anthropic SDK
                ▼                                 ▼
        ┌───────────────┐                 ┌────────────────┐
        │  SQLite / PG  │                 │   Claude API   │
        └───────────────┘                 └────────────────┘
```

**Rendering strategy**
- Pages are **Server Components** that fetch with `src/server/queries.ts` and pass plain data to client islands.
- Mutations use **Server Actions** (`"use server"`) with `revalidatePath`.
- The AI coach uses a **Route Handler** returning a streamed `ReadableStream` (token-by-token).

## 2. UX flow

```
            ┌──────────┐   sign up    ┌────────────┐  finish  ┌───────────┐
 Landing ──▶│  Sign up │ ───────────▶ │ Onboarding │ ───────▶ │ Dashboard │
            └──────────┘              │  wizard    │          └─────┬─────┘
                 │ sign in            └────────────┘                │
                 ▼                                                   │
            ┌──────────┐                                            ▼
            │ Sign in  │ ─── onboardingComplete? ── no ──▶ Onboarding
            └──────────┘                  │ yes
                                          ▼
   Dashboard ⇄ Workouts ⇄ Nutrition ⇄ Progress ⇄ Coach ⇄ Analytics ⇄ Achievements ⇄ Settings
                  │
                  └─▶ Plan detail ─▶ Session player ─▶ (finish) ─▶ celebration ─▶ Dashboard
```

Route guards (in layouts):
- `(app)/layout.tsx`: no session → `/sign-in`; profile not complete → `/onboarding`.
- `onboarding/page.tsx`: complete → `/dashboard`.

## 3. Wireframes (ASCII)

**Dashboard**
```
┌─────────────────────────────────────────────┐
│ Good morning, Alex 👋        [Start workout]  │
├──────────┬──────────┬──────────┬────────────┤
│ Cal left │ Protein  │ Workouts │ Wt trend   │  ← stat cards
├──────────┴────┬─────┴──────────┴────────────┤
│ Activity rings │   Weight trend (area chart) │
├────────────────┼─────────────┬──────────────┤
│ Macros bars    │ Water (fill) │ Weekly goal  │
├────────────────┴─────────────┴──────────────┤
│ Ask your AI coach →                          │
└──────────────────────────────────────────────┘
```

**Workout session player**
```
┌─────────────────────────────────────────────┐
│ Push Day        ⏱ 12:30  🔥 4,200kg  8/12    │ ← sticky, progress bar
├─────────────────────────────────────────────┤
│ [img] Bench Press           Chest            │
│  Set  Weight   Reps   Done                   │
│   1   [ 60 ]  [ 8 ]   [✓]                    │
│   2   [ 60 ]  [ 8 ]   [ ]                    │
│  + Add set                                   │
├─────────────────────────────────────────────┤
│             [ Rest 1:30  +30s  Skip ]        │ ← floats in
│  ───────────────────────────────────────     │
│            [ ✓ Finish workout ]              │ ← fixed bottom
└─────────────────────────────────────────────┘
```

## 4. Component architecture

```
components/
├── ui/                     # primitives (Radix + CVA): button, card, input,
│                           #   dialog, select, tabs, switch, slider, progress…
├── shared/                 # cross-cutting
│   ├── providers.tsx       # SessionProvider + ThemeProvider
│   ├── sidebar / topbar / mobile-nav
│   ├── progress-ring · activity-rings · animated-number
│   ├── charts.tsx          # Recharts wrappers (Area/Bar/MultiLine/Donut)
│   ├── stat-card · empty-state · page-header · logo · confetti · theme-toggle
├── onboarding/onboarding-wizard.tsx
├── dashboard/water-widget.tsx
├── workouts/               # exercise-library, exercise-media, workouts-view,
│                           #   session-player, start-day-button
├── nutrition/              # nutrition-view, food-search-dialog
├── progress/               # progress-view, before-after-slider
├── coach/chat-interface.tsx
└── settings/settings-form.tsx
```

**Server boundary**
```
lib/            (isomorphic)   utils, enums, fitness math, coach prompt builder
lib/auth.ts     (server)       NextAuth config + requireUserId()
server/queries.ts (server)     read helpers (server-only)
server/actions/*  (server)     "use server" mutations
```

## 5. Data flow example — completing a workout
1. `SessionPlayer` (client) calls `completeSession(sessionId, durationSec)` (server action).
2. Action computes volume, marks session complete, calls `awardXp` + `touchStreak` + `unlockAchievement`.
3. `revalidatePath("/dashboard")` invalidates cache.
4. Client fires `fireCelebration()` confetti and shows a summary dialog.
