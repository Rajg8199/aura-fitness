import "server-only";
import { prisma } from "@/lib/prisma";
import { startOfDay, addDays } from "@/lib/utils";
import { sumMacros, weightTrendPerWeek, levelFromXp } from "@/lib/fitness";

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

export async function getUserWithProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
}

/** Aggregate everything the dashboard needs in one place. */
export async function getDashboardData(userId: string) {
  const today = startOfDay();
  const weekAgo = addDays(today, -6);

  const [profile, diaryToday, waterToday, weights, sessionsThisWeek, lastSession] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.diaryEntry.findMany({ where: { userId, date: today } }),
      prisma.waterLog.findMany({ where: { userId, date: today } }),
      prisma.weightLog.findMany({
        where: { userId },
        orderBy: { date: "asc" },
        take: 60,
      }),
      prisma.workoutSession.count({
        where: { userId, completedAt: { not: null, gte: weekAgo } },
      }),
      prisma.workoutSession.findFirst({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: { planDay: true },
      }),
    ]);

  const macros = sumMacros(diaryToday);
  const waterMl = waterToday.reduce((a, w) => a + w.amountMl, 0);
  const trend = weightTrendPerWeek(weights.map((w) => ({ date: w.date, weightKg: w.weightKg })));
  const levelInfo = profile ? levelFromXp(profile.xp) : levelFromXp(0);

  return {
    profile,
    macros,
    waterMl,
    weights,
    trend,
    sessionsThisWeek,
    lastSession,
    levelInfo,
  };
}

export async function getDiaryForDay(userId: string, date: Date) {
  const d = startOfDay(date);
  const entries = await prisma.diaryEntry.findMany({
    where: { userId, date: d },
    include: { foodItem: true },
    orderBy: { createdAt: "asc" },
  });
  return entries;
}

export async function getWaterForDay(userId: string, date: Date) {
  const d = startOfDay(date);
  const logs = await prisma.waterLog.findMany({ where: { userId, date: d } });
  return logs.reduce((a, w) => a + w.amountMl, 0);
}

export async function searchFoods(query: string, userId: string) {
  return prisma.foodItem.findMany({
    where: {
      AND: [
        { OR: [{ isPublic: true }, { userId }] },
        query ? { name: { contains: query } } : {},
      ],
    },
    take: 30,
    orderBy: { name: "asc" },
  });
}

export async function getWeightHistory(userId: string, take = 90) {
  return prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    take,
  });
}

export async function getExercises(filter?: { muscleGroup?: string; q?: string }) {
  return prisma.exercise.findMany({
    where: {
      isPublic: true,
      ...(filter?.muscleGroup && filter.muscleGroup !== "all"
        ? { muscleGroup: filter.muscleGroup }
        : {}),
      ...(filter?.q ? { name: { contains: filter.q } } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getWorkoutPlans() {
  return prisma.workoutPlan.findMany({
    where: { isTemplate: true },
    include: {
      days: {
        orderBy: { dayIndex: "asc" },
        include: { _count: { select: { exercises: true } } },
      },
    },
    orderBy: { daysPerWeek: "asc" },
  });
}

export async function getPlanDetail(slug: string) {
  return prisma.workoutPlan.findUnique({
    where: { slug },
    include: {
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
}

export async function getActiveSession(userId: string) {
  return prisma.workoutSession.findFirst({
    where: { userId, completedAt: null },
    orderBy: { startedAt: "desc" },
    include: {
      planDay: true,
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
      },
    },
  });
}

export async function getWorkoutHistory(userId: string, take = 20) {
  return prisma.workoutSession.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take,
    include: { planDay: true, _count: { select: { exercises: true } } },
  });
}

export async function getAchievements(userId: string) {
  const [all, unlocked] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { xp: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId } }),
  ]);
  const map = new Map(unlocked.map((u) => [u.achievementId, u]));
  return all.map((a) => ({
    ...a,
    unlocked: Boolean(map.get(a.id)?.unlockedAt),
    progress: map.get(a.id)?.progress ?? 0,
    unlockedAt: map.get(a.id)?.unlockedAt ?? null,
  }));
}

export async function getConversations(userId: string) {
  return prisma.coachConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

/** 30-day analytics series for charts. */
export async function getAnalytics(userId: string) {
  const today = startOfDay();
  const start = addDays(today, -29);

  const [weights, diary, water, sessions, exerciseBreakdown] = await Promise.all([
    prisma.weightLog.findMany({ where: { userId, date: { gte: start } }, orderBy: { date: "asc" } }),
    prisma.diaryEntry.findMany({ where: { userId, date: { gte: start } } }),
    prisma.waterLog.findMany({ where: { userId, date: { gte: start } } }),
    prisma.workoutSession.findMany({
      where: { userId, completedAt: { not: null, gte: start } },
      include: { exercises: { include: { exercise: true } } },
    }),
    prisma.sessionExercise.findMany({
      where: { session: { userId, completedAt: { not: null, gte: start } } },
      include: { exercise: true },
    }),
  ]);

  // Build per-day maps
  const days: { date: string; calories: number; protein: number; carbs: number; fat: number; water: number; workouts: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = addDays(start, i);
    const key = d.toISOString().slice(0, 10);
    const dayDiary = diary.filter((e) => e.date.toISOString().slice(0, 10) === key);
    const dayWater = water.filter((w) => w.date.toISOString().slice(0, 10) === key);
    const dayWorkouts = sessions.filter((s) => s.completedAt?.toISOString().slice(0, 10) === key);
    const m = sumMacros(dayDiary);
    days.push({
      date: key,
      calories: Math.round(m.calories),
      protein: Math.round(m.protein),
      carbs: Math.round(m.carbs),
      fat: Math.round(m.fat),
      water: dayWater.reduce((a, w) => a + w.amountMl, 0),
      workouts: dayWorkouts.length,
    });
  }

  // Muscle group distribution
  const muscleCount: Record<string, number> = {};
  for (const se of exerciseBreakdown) {
    const g = se.exercise.muscleGroup;
    muscleCount[g] = (muscleCount[g] ?? 0) + 1;
  }

  return {
    days,
    weights: weights.map((w) => ({ date: w.date.toISOString().slice(0, 10), weightKg: w.weightKg })),
    muscleDistribution: Object.entries(muscleCount).map(([name, value]) => ({ name, value })),
    totalSessions: sessions.length,
  };
}
