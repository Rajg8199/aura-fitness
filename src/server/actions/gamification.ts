"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, addDays } from "@/lib/utils";
import { levelFromXp } from "@/lib/fitness";

/** Add XP and recompute level. Returns whether the user leveled up. */
export async function awardXp(userId: string, amount: number) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return { leveledUp: false, level: 1 };
  const newXp = profile.xp + amount;
  const before = levelFromXp(profile.xp).level;
  const after = levelFromXp(newXp).level;
  await prisma.profile.update({
    where: { userId },
    data: { xp: newXp, level: after },
  });
  if (after > before) {
    if (after >= 5) await unlockAchievement(userId, "level_5");
    if (after >= 10) await unlockAchievement(userId, "level_10");
  }
  return { leveledUp: after > before, level: after };
}

/**
 * Record today's activity and recompute the streak.
 * Pass flags for the activity that just happened.
 */
export async function touchStreak(
  userId: string,
  flags: Partial<{ workoutDone: boolean; nutritionLogged: boolean; waterGoalMet: boolean; weightLogged: boolean }> = {}
) {
  const today = startOfDay();

  await prisma.dailyActivity.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, ...flags },
    update: { ...flags },
  });

  // Recompute streak by walking backwards from today
  const recent = await prisma.dailyActivity.findMany({
    where: { userId, date: { lte: today, gte: addDays(today, -400) } },
    orderBy: { date: "desc" },
  });
  const activeDays = new Set(recent.map((d) => d.date.toISOString().slice(0, 10)));

  let streak = 0;
  let cursor = today;
  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const longest = Math.max(profile?.longestStreak ?? 0, streak);
  await prisma.profile.update({
    where: { userId },
    data: { currentStreak: streak, longestStreak: longest, lastActiveDate: today },
  });

  // Streak achievements
  if (streak >= 3) await unlockAchievement(userId, "streak_3");
  if (streak >= 7) await unlockAchievement(userId, "streak_7");
  if (streak >= 30) await unlockAchievement(userId, "streak_30");

  return { streak, longest };
}

/** Unlock an achievement by key (idempotent). Awards its XP once. */
export async function unlockAchievement(userId: string, key: string) {
  const achievement = await prisma.achievement.findUnique({ where: { key } });
  if (!achievement) return { unlocked: false };

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });
  if (existing?.unlockedAt) return { unlocked: false };

  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
    create: { userId, achievementId: achievement.id, progress: achievement.threshold, unlockedAt: new Date() },
    update: { progress: achievement.threshold, unlockedAt: new Date() },
  });

  // Award XP without recursing into achievement checks
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (profile) {
    const newXp = profile.xp + achievement.xp;
    await prisma.profile.update({
      where: { userId },
      data: { xp: newXp, level: levelFromXp(newXp).level },
    });
  }
  return { unlocked: true, achievement };
}
