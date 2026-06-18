import "server-only";
import { prisma } from "@/lib/prisma";
import { startOfDay, addDays } from "@/lib/utils";
import { sumMacros, weightTrendPerWeek } from "@/lib/fitness";
import type { CoachContext } from "@/lib/coach";

/** Assemble the user's current fitness state for the AI coach. */
export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const today = startOfDay();
  const weekAgo = addDays(today, -6);

  const [user, diaryToday, weights, workoutsThisWeek] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    prisma.diaryEntry.findMany({ where: { userId, date: today } }),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 30 }),
    prisma.workoutSession.count({ where: { userId, completedAt: { not: null, gte: weekAgo } } }),
  ]);

  const macros = sumMacros(diaryToday);
  const trend = weightTrendPerWeek(weights.map((w) => ({ date: w.date, weightKg: w.weightKg })));
  const p = user?.profile;

  return {
    name: user?.name ?? "there",
    goal: p?.goal ?? undefined,
    age: p?.age,
    weightKg: p?.weightKg,
    targetWeightKg: p?.targetWeightKg,
    targetCalories: p?.targetCalories,
    proteinG: p?.proteinG,
    currentStreak: p?.currentStreak ?? 0,
    level: p?.level ?? 1,
    recentWeightTrend: trend,
    caloriesToday: Math.round(macros.calories),
    proteinToday: Math.round(macros.protein),
    workoutsThisWeek,
  };
}
