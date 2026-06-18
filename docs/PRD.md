# Aura — Product Requirements Document

## 1. Vision
Aura is a premium AI health coach that turns a user's goals into a concrete plan and
their plan into measurable results. It unifies training, nutrition, body tracking,
coaching, and motivation in one beautiful, addictive experience that competes with
MyFitnessPal, Fitbod, Hevy, Nike Training Club, and Apple Fitness.

## 2. Target users
- **Beginners** who want a guided, no-guesswork plan.
- **Intermediate lifters** who track workouts and macros and want better insight.
- **Body-recomp & weight-loss** users who care about trends and accountability.

## 3. Goals & success metrics
| Goal | Metric |
| --- | --- |
| Activation | % of sign-ups completing onboarding (target > 80%) |
| Engagement | DAU/WAU, average streak length |
| Retention | D7 / D30 retention |
| Habit formation | % of days with at least one log |
| Coaching value | Coach messages per active user |

## 4. Core user stories
1. *As a new user*, I answer a few questions and instantly see my calories, macros, and water goal.
2. *As a lifter*, I pick a plan, run a guided session with a rest timer, and log my sets.
3. *As a tracker*, I log meals in seconds and watch my macro rings fill.
4. *As a dieter*, I log my weight and see a trend line with a projected goal date.
5. *As someone who needs accountability*, I keep a streak, earn XP, and unlock badges.
6. *As someone who needs guidance*, I ask my AI coach what to do and get personalized advice.

## 5. Feature scope (v1 — delivered)
- **Auth**: email/password (NextAuth credentials, JWT sessions).
- **Onboarding**: name, age, gender, height, weight, activity, goal, target, experience → auto-calc BMI/BMR/TDEE/target calories/macros/water.
- **Dashboard**: activity rings, calorie/macro/water/weight/streak/weekly-goal widgets, charts.
- **Workouts**: exercise library (search + filter + detail), plan templates (Full Body, PPL, Upper/Lower, Arnold), guided session player (timer, rest timer, set logging, add/remove sets/exercises, completion celebration), history.
- **Nutrition**: macro summary, meal-grouped diary, food search, custom foods, suggested plan, water tracker.
- **Progress**: weight log + projection, measurements, photos, before/after slider.
- **AI Coach**: streaming chat (Claude with offline fallback), context-aware of the user's live data.
- **Gamification**: XP, levels, streaks, achievements.
- **Analytics**: 30-day trends + muscle distribution.
- **Settings**: edit profile/goals (recalculates targets), reminders, theme.

## 6. Out of scope (future)
- Social feed / friends / leaderboards.
- Apple Health / Google Fit / wearable sync.
- Barcode scanning & external nutrition API.
- Real push notifications (reminders are modeled but not dispatched).
- Native mobile apps (PWA manifest is included).
- Billing/subscriptions (pricing UI exists; Stripe not wired).

## 7. Non-functional requirements
- **Performance**: Server Components by default, code-split client islands, lazy charts. Lighthouse 95+ target.
- **Responsive**: mobile-first; bottom nav on mobile, sidebar on desktop.
- **Accessibility**: semantic HTML, Radix primitives, focus rings, reduced-motion respected for confetti.
- **SEO**: metadata, OpenGraph, manifest on marketing pages.
- **Portability**: SQLite for dev, Postgres for prod (single datasource swap).

## 8. Design language
Apple Fitness × Linear × Stripe × Notion × Raycast. Glassmorphism, mesh gradients,
brand violet→fuchsia→cyan palette, Sora display + Inter body, soft shadows, fluid motion.
```
```
