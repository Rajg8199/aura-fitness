"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { calcNutritionTargets } from "@/lib/fitness";
import { ACTIVITY_LEVELS, GENDERS, GOALS, EXPERIENCE_LEVELS } from "@/lib/enums";

const onboardingSchema = z.object({
  age: z.coerce.number().int().min(13).max(100),
  gender: z.enum(GENDERS),
  heightCm: z.coerce.number().min(120).max(250),
  weightKg: z.coerce.number().min(30).max(300),
  targetWeightKg: z.coerce.number().min(30).max(300),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  goal: z.enum(GOALS),
  experience: z.enum(EXPERIENCE_LEVELS),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;

export async function saveOnboarding(input: OnboardingInput) {
  const userId = await requireUserId();
  const data = onboardingSchema.parse(input);

  const targets = calcNutritionTargets({
    age: data.age,
    gender: data.gender,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    activityLevel: data.activityLevel,
    goal: data.goal,
  });

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
      ...targets,
      onboardingComplete: true,
    },
    update: {
      ...data,
      ...targets,
      onboardingComplete: true,
    },
  });

  // Seed an initial weight log so charts have a starting point
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.weightLog.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, weightKg: data.weightKg },
    update: { weightKg: data.weightKg },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProfileSettings(input: Partial<OnboardingInput> & { unit?: string; waterGoalMl?: number }) {
  const userId = await requireUserId();
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new Error("No profile");

  const merged = {
    age: input.age ?? profile.age!,
    gender: (input.gender ?? profile.gender) as never,
    heightCm: input.heightCm ?? profile.heightCm!,
    weightKg: input.weightKg ?? profile.weightKg!,
    activityLevel: (input.activityLevel ?? profile.activityLevel) as never,
    goal: (input.goal ?? profile.goal) as never,
  };
  const targets = calcNutritionTargets(merged);

  await prisma.profile.update({
    where: { userId },
    data: {
      ...input,
      ...targets,
      ...(input.waterGoalMl ? { waterGoalMl: input.waterGoalMl } : {}),
    },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
