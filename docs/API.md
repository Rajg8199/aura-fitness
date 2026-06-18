# API & Server Actions

Aura uses **Server Actions** for mutations and **Route Handlers** for auth and the
streaming AI coach. Reads happen in Server Components via `src/server/queries.ts`.

## Route Handlers

### `POST /api/coach`
Streams an AI coach reply (token-by-token, `text/plain`).

**Request**
```json
{ "message": "How am I progressing?", "conversationId": "optional" }
```
**Behavior**
- Requires an authenticated session (401 otherwise).
- Creates a conversation if `conversationId` is omitted.
- Persists the user message, builds context from the user's live data
  (`src/server/coach-context.ts`), and streams the reply.
- Uses **Claude** when `ANTHROPIC_API_KEY` is set, otherwise a rule-based fallback.
- Persists the assistant message on completion.
- Response header `X-Conversation-Id` returns the conversation id.

### `GET|POST /api/auth/[...nextauth]`
NextAuth v5 endpoints (sign-in, callback, session, csrf, providers, sign-out).

## Server Actions

### `server/actions/auth.ts`
| Action | Signature | Notes |
| --- | --- | --- |
| `signUpAction` | `(prev, FormData) → {error?|success?}` | Validates with Zod, hashes password, creates User + empty Profile |

### `server/actions/profile.ts`
| Action | Signature |
| --- | --- |
| `saveOnboarding` | `(OnboardingInput) → {success}` — validates, computes targets, upserts Profile, seeds first weight log |
| `updateProfileSettings` | `(partial) → {success}` — recalculates targets on change |

### `server/actions/tracking.ts`
| Action | Signature |
| --- | --- |
| `addWater` / `undoLastWater` | `(amountMl)` / `()` |
| `logFood` | `({foodItemId?, customName?, mealType, servings, macros, date?})` |
| `deleteDiaryEntry` | `(id)` |
| `createCustomFood` | `({name, macros, serving})` → `{food}` |
| `logWeight` / `deleteWeight` | `(weightKg, date?)` / `(id)` |
| `logMeasurement` | `({chestCm?, waistCm?, ...})` |
| `addProgressPhoto` | `({url, pose, weightKg?})` |

### `server/actions/workout.ts`
| Action | Signature |
| --- | --- |
| `startSessionFromPlanDay` | `(planDayId)` → creates session w/ sets, redirects to player |
| `startEmptySession` | `()` → blank session |
| `addExerciseToSession` | `(sessionId, exerciseId)` |
| `updateSetLog` | `(setId, {reps?, weightKg?, completed?})` |
| `addSet` / `removeSet` | `(sessionExerciseId)` / `(setId)` |
| `completeSession` | `(sessionId, durationSec)` → volume, XP, streak, achievements |
| `discardSession` | `(sessionId)` |

### `server/actions/gamification.ts`
| Action | Signature |
| --- | --- |
| `awardXp` | `(userId, amount)` → `{leveledUp, level}` |
| `touchStreak` | `(userId, flags?)` → recomputes current/longest streak |
| `unlockAchievement` | `(userId, key)` → idempotent, awards XP once |

### `server/actions/settings.ts`
`toggleReminder(id, enabled)`, `updateReminderTime(id, time)`, `ensureReminders()`.

## Read helpers — `server/queries.ts`
`getDashboardData`, `getDiaryForDay`, `getWaterForDay`, `searchFoods`,
`getWeightHistory`, `getExercises`, `getWorkoutPlans`, `getPlanDetail`,
`getActiveSession`, `getWorkoutHistory`, `getAchievements`, `getConversations`,
`getAnalytics`.

## Auth contract
- Strategy: JWT sessions (no DB adapter needed for credentials).
- `requireUserId()` (in `src/lib/auth.ts`) returns the session user id or throws — use at the top of every mutating action.
- `trustHost: true` is enabled for deployment behind Vercel's proxy.
