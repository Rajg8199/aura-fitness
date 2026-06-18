"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { awardXp, touchStreak, unlockAchievement } from "./gamification";

/** Parse a rep range like "8-12" or "AMRAP" into a sensible default rep count. */
function defaultReps(reps: string): number {
  const m = reps.match(/(\d+)/);
  return m ? Number(m[1]) : 10;
}

/** Start a workout from a plan day. Closes any in-progress session first. */
export async function startSessionFromPlanDay(planDayId: string) {
  const userId = await requireUserId();

  await prisma.workoutSession.updateMany({
    where: { userId, completedAt: null },
    data: { completedAt: new Date() },
  });

  const planDay = await prisma.planDay.findUnique({
    where: { id: planDayId },
    include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } }, plan: true },
  });
  if (!planDay) throw new Error("Plan day not found");

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      planId: planDay.planId,
      planDayId: planDay.id,
      name: planDay.name,
      exercises: {
        create: planDay.exercises.map((pe, i) => ({
          exerciseId: pe.exerciseId,
          order: i,
          sets: {
            create: Array.from({ length: pe.sets }).map((_, s) => ({
              setNumber: s + 1,
              reps: defaultReps(pe.reps),
              weightKg: 0,
              completed: false,
            })),
          },
        })),
      },
    },
  });

  redirect(`/workouts/session/${session.id}`);
}

export async function startEmptySession() {
  const userId = await requireUserId();
  await prisma.workoutSession.updateMany({
    where: { userId, completedAt: null },
    data: { completedAt: new Date() },
  });
  const session = await prisma.workoutSession.create({
    data: { userId, name: "Quick Workout" },
  });
  redirect(`/workouts/session/${session.id}`);
}

export async function addExerciseToSession(sessionId: string, exerciseId: string) {
  const userId = await requireUserId();
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId }, include: { exercises: true } });
  if (!session) throw new Error("Not found");
  await prisma.sessionExercise.create({
    data: {
      sessionId,
      exerciseId,
      order: session.exercises.length,
      sets: { create: [{ setNumber: 1, reps: 10, weightKg: 0 }] },
    },
  });
  revalidatePath(`/workouts/session/${sessionId}`);
  return { success: true };
}

export async function updateSetLog(setId: string, data: { reps?: number; weightKg?: number; completed?: boolean }) {
  await requireUserId();
  await prisma.setLog.update({ where: { id: setId }, data });
  return { success: true };
}

export async function addSet(sessionExerciseId: string) {
  await requireUserId();
  const last = await prisma.setLog.findFirst({
    where: { sessionExerciseId },
    orderBy: { setNumber: "desc" },
  });
  const created = await prisma.setLog.create({
    data: {
      sessionExerciseId,
      setNumber: (last?.setNumber ?? 0) + 1,
      reps: last?.reps ?? 10,
      weightKg: last?.weightKg ?? 0,
    },
  });
  return { success: true, set: created };
}

export async function removeSet(setId: string) {
  await requireUserId();
  await prisma.setLog.delete({ where: { id: setId } });
  return { success: true };
}

export async function completeSession(sessionId: string, durationSec: number) {
  const userId = await requireUserId();
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: { exercises: { include: { sets: true } } },
  });
  if (!session) throw new Error("Not found");

  const volume = session.exercises
    .flatMap((e) => e.sets)
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.weightKg * s.reps, 0);

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { completedAt: new Date(), durationSec, totalVolume: volume },
  });

  // Gamification
  await awardXp(userId, 100);
  await touchStreak(userId, { workoutDone: true });
  await unlockAchievement(userId, "first_workout");
  const count = await prisma.workoutSession.count({ where: { userId, completedAt: { not: null } } });
  if (count >= 10) await unlockAchievement(userId, "workouts_10");
  if (count >= 50) await unlockAchievement(userId, "workouts_50");

  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  return { success: true, volume, count };
}

export async function discardSession(sessionId: string) {
  const userId = await requireUserId();
  await prisma.workoutSession.deleteMany({ where: { id: sessionId, userId, completedAt: null } });
  revalidatePath("/workouts");
  redirect("/workouts");
}
