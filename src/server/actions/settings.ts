"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function toggleReminder(id: string, enabled: boolean) {
  const userId = await requireUserId();
  await prisma.reminder.updateMany({ where: { id, userId }, data: { enabled } });
  revalidatePath("/settings");
  return { success: true };
}

export async function updateReminderTime(id: string, time: string) {
  const userId = await requireUserId();
  await prisma.reminder.updateMany({ where: { id, userId }, data: { time } });
  revalidatePath("/settings");
  return { success: true };
}

const DEFAULT_REMINDERS = [
  { type: "workout", label: "Time to train 💪", time: "18:00" },
  { type: "water", label: "Hydrate!", time: "11:00" },
  { type: "meal", label: "Log your meals", time: "13:00" },
  { type: "weight", label: "Morning weigh-in", time: "07:30" },
];

export async function ensureReminders() {
  const userId = await requireUserId();
  const count = await prisma.reminder.count({ where: { userId } });
  if (count === 0) {
    await prisma.reminder.createMany({
      data: DEFAULT_REMINDERS.map((r) => ({ ...r, userId })),
    });
  }
  revalidatePath("/settings");
  return { success: true };
}
