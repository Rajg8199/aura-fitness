import { ACTIVITY_META, GOAL_META, type ActivityLevel, type Gender, type Goal } from "./enums";
import { round } from "./utils";

export interface ProfileInput {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface NutritionTargets {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  waterGoalMl: number;
}

/** Mifflin–St Jeor Basal Metabolic Rate. */
export function calcBMR({ age, gender, heightCm, weightKg }: ProfileInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78; // neutral midpoint
}

/** Total Daily Energy Expenditure. */
export function calcTDEE(input: ProfileInput): number {
  return calcBMR(input) * ACTIVITY_META[input.activityLevel].factor;
}

export function calcBMI(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/**
 * Full nutrition target calculation.
 * Protein is set per kg of bodyweight (goal-dependent), fat as a % of calories,
 * and carbs fill the remaining energy.
 */
export function calcNutritionTargets(input: ProfileInput): NutritionTargets {
  const bmr = calcBMR(input);
  const tdee = calcTDEE(input);
  const goalMeta = GOAL_META[input.goal];
  const targetCalories = tdee * (1 + goalMeta.calorieDelta);

  const proteinG = input.weightKg * goalMeta.proteinPerKg;
  const fatG = (targetCalories * goalMeta.fatPct) / 9;
  const carbsCalories = targetCalories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, carbsCalories / 4);

  const bmi = calcBMI(input.weightKg, input.heightCm);

  return {
    bmi: round(bmi, 1),
    bmiCategory: bmiCategory(bmi),
    bmr: round(bmr),
    tdee: round(tdee),
    targetCalories: round(targetCalories),
    proteinG: round(proteinG),
    fatG: round(fatG),
    carbsG: round(carbsG),
    waterGoalMl: round(Math.max(2000, input.weightKg * 35) / 50) * 50, // ~35ml/kg, rounded to 50ml
  };
}

/**
 * Estimate the date a weight goal will be reached given a calorie delta.
 * ~7700 kcal per kg of body mass.
 */
export function estimateGoalDate(
  currentWeightKg: number,
  targetWeightKg: number,
  dailyCalorieDelta: number
): { weeks: number; date: Date } | null {
  const kgToChange = targetWeightKg - currentWeightKg;
  if (Math.abs(kgToChange) < 0.1 || Math.abs(dailyCalorieDelta) < 1) return null;
  // delta must point the same direction as the goal
  if (Math.sign(kgToChange) !== Math.sign(dailyCalorieDelta)) return null;
  const kgPerWeek = (dailyCalorieDelta * 7) / 7700;
  const weeks = Math.abs(kgToChange / kgPerWeek);
  const date = new Date();
  date.setDate(date.getDate() + Math.round(weeks * 7));
  return { weeks: round(weeks, 1), date };
}

/** Linear-regression trend (kg/week) over weight history. */
export function weightTrendPerWeek(points: { date: Date; weightKg: number }[]): number {
  if (points.length < 2) return 0;
  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
  const t0 = sorted[0].date.getTime();
  const xs = sorted.map((p) => (p.date.getTime() - t0) / (1000 * 60 * 60 * 24)); // days
  const ys = sorted.map((p) => p.weightKg);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  const slopePerDay = (n * sumXY - sumX * sumY) / denom;
  return round(slopePerDay * 7, 2);
}

// ── Gamification: XP & levels ───────────────────────────
/** XP required to reach a given level (quadratic curve). */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp: number): { level: number; current: number; needed: number; pct: number } {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const current = xp - floor;
  const needed = ceil - floor;
  return { level, current, needed, pct: needed > 0 ? (current / needed) * 100 : 100 };
}

/** Sum (weight × reps) of completed sets. */
export function sessionVolume(
  sets: { weightKg: number; reps: number; completed: boolean }[]
): number {
  return sets.filter((s) => s.completed).reduce((acc, s) => acc + s.weightKg * s.reps, 0);
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function sumMacros(entries: MacroTotals[]): MacroTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
