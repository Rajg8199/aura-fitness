"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { startOfDay } from "@/lib/utils";
import { awardXp, touchStreak } from "./gamification";

// ── Water ────────────────────────────────────────────────
export async function addWater(amountMl: number) {
  const userId = await requireUserId();
  await prisma.waterLog.create({
    data: { userId, date: startOfDay(), amountMl },
  });
  await touchStreak(userId);
  revalidatePath("/dashboard");
  revalidatePath("/nutrition");
  return { success: true };
}

export async function undoLastWater() {
  const userId = await requireUserId();
  const last = await prisma.waterLog.findFirst({
    where: { userId, date: startOfDay() },
    orderBy: { createdAt: "desc" },
  });
  if (last) await prisma.waterLog.delete({ where: { id: last.id } });
  revalidatePath("/dashboard");
  revalidatePath("/nutrition");
  return { success: true };
}

// ── Food diary ───────────────────────────────────────────
export async function logFood(input: {
  foodItemId?: string;
  customName?: string;
  mealType: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date?: string;
}) {
  const userId = await requireUserId();
  const date = input.date ? startOfDay(new Date(input.date)) : startOfDay();
  await prisma.diaryEntry.create({
    data: {
      userId,
      date,
      mealType: input.mealType,
      foodItemId: input.foodItemId ?? null,
      customName: input.customName ?? null,
      servings: input.servings,
      calories: Math.round(input.calories),
      protein: +input.protein.toFixed(1),
      carbs: +input.carbs.toFixed(1),
      fat: +input.fat.toFixed(1),
    },
  });
  await awardXp(userId, 10);
  await touchStreak(userId, { nutritionLogged: true });
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDiaryEntry(id: string) {
  const userId = await requireUserId();
  await prisma.diaryEntry.deleteMany({ where: { id, userId } });
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createCustomFood(input: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: number;
  servingUnit?: string;
}) {
  const userId = await requireUserId();
  const food = await prisma.foodItem.create({
    data: {
      userId,
      isPublic: false,
      name: input.name,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      servingSize: input.servingSize ?? 100,
      servingUnit: input.servingUnit ?? "g",
    },
  });
  revalidatePath("/nutrition");
  return { success: true, food };
}

// ── Weight ───────────────────────────────────────────────
export async function logWeight(weightKg: number, dateStr?: string) {
  const userId = await requireUserId();
  const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay();
  await prisma.weightLog.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, weightKg },
    update: { weightKg },
  });
  // keep profile's current weight in sync with the latest entry
  await prisma.profile.update({ where: { userId }, data: { weightKg } }).catch(() => {});
  await awardXp(userId, 5);
  await touchStreak(userId, { weightLogged: true });
  revalidatePath("/progress");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteWeight(id: string) {
  const userId = await requireUserId();
  await prisma.weightLog.deleteMany({ where: { id, userId } });
  revalidatePath("/progress");
  return { success: true };
}

// ── Body measurements ────────────────────────────────────
export async function logMeasurement(input: {
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  bodyFatPct?: number;
}) {
  const userId = await requireUserId();
  await prisma.bodyMeasurement.create({ data: { userId, date: startOfDay(), ...input } });
  revalidatePath("/progress");
  return { success: true };
}

export async function addProgressPhoto(input: { url: string; pose: string; weightKg?: number }) {
  const userId = await requireUserId();
  await prisma.progressPhoto.create({
    data: { userId, date: startOfDay(), url: input.url, pose: input.pose, weightKg: input.weightKg },
  });
  revalidatePath("/progress");
  return { success: true };
}
