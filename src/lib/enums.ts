// Centralized "enum" values + human labels. Stored as strings in the DB so the
// schema stays portable between SQLite and Postgres.

export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_META: Record<
  ActivityLevel,
  { label: string; description: string; factor: number }
> = {
  sedentary: { label: "Sedentary", description: "Little or no exercise, desk job", factor: 1.2 },
  light: { label: "Lightly Active", description: "Light exercise 1–3 days/week", factor: 1.375 },
  moderate: { label: "Moderately Active", description: "Moderate exercise 3–5 days/week", factor: 1.55 },
  active: { label: "Active", description: "Hard exercise 6–7 days/week", factor: 1.725 },
  very_active: { label: "Very Active", description: "Athlete / physical job", factor: 1.9 },
};

export const GOALS = [
  "weight_loss",
  "lean_muscle",
  "bulking",
  "recomposition",
  "maintenance",
] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_META: Record<
  Goal,
  { label: string; description: string; calorieDelta: number; proteinPerKg: number; fatPct: number; emoji: string }
> = {
  weight_loss: { label: "Weight Loss", description: "Shed fat while keeping muscle", calorieDelta: -0.18, proteinPerKg: 2.2, fatPct: 0.25, emoji: "🔥" },
  lean_muscle: { label: "Lean Muscle Gain", description: "Build muscle, stay lean", calorieDelta: 0.08, proteinPerKg: 2.0, fatPct: 0.25, emoji: "💪" },
  bulking: { label: "Bulking", description: "Maximize size and strength", calorieDelta: 0.18, proteinPerKg: 1.8, fatPct: 0.25, emoji: "🚀" },
  recomposition: { label: "Body Recomposition", description: "Lose fat and gain muscle at once", calorieDelta: 0, proteinPerKg: 2.2, fatPct: 0.27, emoji: "⚖️" },
  maintenance: { label: "Maintenance", description: "Maintain your current physique", calorieDelta: 0, proteinPerKg: 1.8, fatPct: 0.3, emoji: "🌿" },
};

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Experience = (typeof EXPERIENCE_LEVELS)[number];

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "full_body",
  "cardio",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  full_body: "Full Body",
  cardio: "Cardio",
};

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
] as const;

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_META: Record<MealType, { label: string; icon: string; calorieShare: number }> = {
  breakfast: { label: "Breakfast", icon: "☀️", calorieShare: 0.25 },
  lunch: { label: "Lunch", icon: "🥗", calorieShare: 0.35 },
  dinner: { label: "Dinner", icon: "🍽️", calorieShare: 0.3 },
  snack: { label: "Snacks", icon: "🍎", calorieShare: 0.1 },
};

export function label<T extends Record<string, { label: string }>>(
  meta: T,
  key: string,
  fallback = key
) {
  return (meta as Record<string, { label: string }>)[key]?.label ?? fallback;
}
