import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [profile, reminders] = await Promise.all([
    getProfile(userId),
    prisma.reminder.findMany({ where: { userId }, orderBy: { time: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, goals, and reminders." />
      <SettingsForm
        profile={{
          age: profile?.age ?? null,
          heightCm: profile?.heightCm ?? null,
          weightKg: profile?.weightKg ?? null,
          targetWeightKg: profile?.targetWeightKg ?? null,
          activityLevel: profile?.activityLevel ?? null,
          goal: profile?.goal ?? null,
          targetCalories: profile?.targetCalories ?? null,
          proteinG: profile?.proteinG ?? null,
          carbsG: profile?.carbsG ?? null,
          fatG: profile?.fatG ?? null,
          waterGoalMl: profile?.waterGoalMl ?? 2500,
        }}
        reminders={reminders}
      />
    </div>
  );
}
