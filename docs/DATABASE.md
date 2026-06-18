# Database Schema

Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma).
Provider is **SQLite** for local dev. The design is **Postgres-compatible**:
"enums" are stored as `String` (validated in [`src/lib/enums.ts`](../src/lib/enums.ts))
and lists use comma-separated strings — so moving to Postgres is a one-line datasource change.

## Entity relationships

```
User 1───1 Profile
User 1───* WorkoutPlan 1───* PlanDay 1───* PlanExercise *───1 Exercise
User 1───* WorkoutSession 1───* SessionExercise 1───* SetLog
            │                         └───────────────* Exercise
User 1───* DiaryEntry *───0..1 FoodItem
User 1───* WaterLog
User 1───* WeightLog        (unique per user+day)
User 1───* BodyMeasurement
User 1───* ProgressPhoto
User 1───* CoachConversation 1───* CoachMessage
User 1───* UserAchievement *───1 Achievement
User 1───* DailyActivity     (unique per user+day, powers streaks)
User 1───* Reminder
User 1───* FoodItem          (custom foods)
```

## Models

| Model | Purpose | Key fields |
| --- | --- | --- |
| **User** | Identity | `email` (unique), `passwordHash`, `role` |
| **Profile** | Body stats, calculated targets, gamification state | `goal`, `activityLevel`, `bmr`, `tdee`, `targetCalories`, `proteinG/fatG/carbsG`, `waterGoalMl`, `xp`, `level`, `currentStreak`, `onboardingComplete` |
| **Exercise** | Library item | `slug`, `muscleGroup`, `equipment`, `difficulty`, `instructions`, `gifUrl`, `imageUrl` |
| **WorkoutPlan** | Template or user plan | `split`, `level`, `daysPerWeek`, `isTemplate` |
| **PlanDay** | A day within a plan | `dayIndex`, `name`, `focus` |
| **PlanExercise** | Prescribed work | `sets`, `reps` (range string), `restSec` |
| **WorkoutSession** | A performed workout | `startedAt`, `completedAt`, `durationSec`, `totalVolume` |
| **SessionExercise / SetLog** | Logged sets | `setNumber`, `reps`, `weightKg`, `rpe`, `completed` |
| **FoodItem** | Food (public or custom) | per-serving `calories/protein/carbs/fat`, `servingSize/Unit` |
| **DiaryEntry** | A logged food | `mealType`, `servings`, denormalized macros |
| **WaterLog** | Water intake event | `amountMl` |
| **WeightLog** | Daily weight | unique `(userId, date)` |
| **BodyMeasurement** | Tape measurements | `chestCm`, `waistCm`, … `bodyFatPct` |
| **ProgressPhoto** | Transformation photo | `url`, `pose` |
| **CoachConversation / CoachMessage** | AI chat history | `role`, `content` |
| **Achievement / UserAchievement** | Badges + unlock state | `key`, `xp`, `threshold`, `unlockedAt` |
| **DailyActivity** | Per-day activity flags | `workoutDone`, `nutritionLogged`, `waterGoalMet`, `weightLogged` |
| **Reminder** | Notification config | `type`, `time`, `enabled` |

## Indexing
- `User.email` (login lookups)
- `WorkoutSession (userId, startedAt)`, `DiaryEntry (userId, date)`, `WaterLog (userId, date)`, `WeightLog (userId, date)` — fast dashboard/day queries
- `Exercise.muscleGroup`, `Exercise.category` — library filtering
- Unique constraints: `WeightLog(userId,date)`, `DailyActivity(userId,date)`, `UserAchievement(userId,achievementId)`

## Seed data
`prisma/seed.ts` creates 28 exercises, 30 foods, 4 plan templates (Beginner Full Body,
PPL, Upper/Lower, Arnold), 14 achievements, and a fully-populated demo user
(`demo@aura.fit` / `demo1234`) with 30 days of weight history, today's meals, water,
completed sessions, streak, and unlocked badges.

## Moving to Postgres
```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```
Then `prisma migrate dev` (or `prisma db push`) and re-seed. No model changes required.
