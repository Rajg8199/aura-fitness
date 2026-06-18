import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfile, getWeightHistory } from "@/server/queries";
import { estimateGoalDate } from "@/lib/fitness";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressView } from "@/components/progress/progress-view";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile, weights, photos, measurements] = await Promise.all([
    getProfile(userId),
    getWeightHistory(userId),
    prisma.progressPhoto.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.bodyMeasurement.findMany({ where: { userId }, orderBy: { date: "desc" } }),
  ]);

  const current = profile?.weightKg ?? weights.at(-1)?.weightKg ?? 0;
  const target = profile?.targetWeightKg ?? current;
  const eta = estimateGoalDate(current, target, (profile?.targetCalories ?? 0) - (profile?.tdee ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="Track your body, measurements and transformation." />
      <ProgressView
        weights={weights.map((w) => ({ id: w.id, date: w.date.toISOString().slice(0, 10), weightKg: w.weightKg }))}
        photos={photos.map((p) => ({ id: p.id, url: p.url, pose: p.pose, date: p.date.toISOString() }))}
        measurements={measurements.map((m) => ({
          date: m.date.toISOString(),
          chestCm: m.chestCm, waistCm: m.waistCm, armsCm: m.armsCm, thighsCm: m.thighsCm, bodyFatPct: m.bodyFatPct,
        }))}
        goal={{
          current: +current.toFixed(1),
          target: +target.toFixed(1),
          eta: eta ? eta.date.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null,
        }}
      />
    </div>
  );
}
