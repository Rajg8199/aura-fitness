import { auth } from "@/lib/auth";
import { getAchievements, getProfile } from "@/server/queries";
import { levelFromXp } from "@/lib/fitness";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Dumbbell, Flame, Trophy, Zap, CalendarCheck, Crown, Utensils, Egg,
  Droplet, Scale, TrendingDown, TrendingUp, Star, Medal, Lock, type LucideIcon,
} from "lucide-react";

export const metadata = { title: "Achievements" };

const ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell, flame: Flame, trophy: Trophy, zap: Zap,
  "calendar-check": CalendarCheck, crown: Crown, utensils: Utensils, egg: Egg,
  droplet: Droplet, scale: Scale, "trending-down": TrendingDown,
  "trending-up": TrendingUp, star: Star, medal: Medal,
};

export default async function AchievementsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [achievements, profile] = await Promise.all([getAchievements(userId), getProfile(userId)]);

  const level = levelFromXp(profile?.xp ?? 0);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Achievements" description="Earn XP, level up, and collect badges as you train." />

      {/* Level + XP header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-mesh opacity-70" />
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <span className="font-display text-3xl font-extrabold">{level.level}</span>
              <span className="absolute -bottom-2 rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-foreground shadow">LEVEL</span>
            </div>
            <div>
              <div className="font-display text-xl font-bold">{profile?.xp ?? 0} XP total</div>
              <div className="text-sm text-muted-foreground">{unlockedCount} / {achievements.length} badges unlocked</div>
              <div className="mt-2 w-48">
                <Progress value={level.pct} indicatorClassName="bg-brand-gradient" />
                <div className="mt-1 text-xs text-muted-foreground">{level.current}/{level.needed} XP to level {level.level + 1}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Stat label="Streak" value={`${profile?.currentStreak ?? 0}🔥`} />
            <Stat label="Best" value={`${profile?.longestStreak ?? 0}`} />
          </div>
        </CardContent>
      </Card>

      {/* Badge grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const Icon = ICONS[a.icon] ?? Trophy;
          return (
            <Card key={a.id} className={cn("relative overflow-hidden p-5 transition-all", a.unlocked ? "border-primary/30" : "opacity-70")}>
              {a.unlocked && <div className="absolute inset-0 -z-10 bg-brand-gradient-soft opacity-60" />}
              <div className="flex items-start gap-4">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", a.unlocked ? "bg-brand-gradient text-white shadow-glow" : "bg-secondary text-muted-foreground")}>
                  {a.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold">{a.name}</h3>
                    {a.unlocked && <Badge variant="gradient" className="shrink-0">+{a.xp}</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.description}</p>
                  {a.unlocked && a.unlockedAt && (
                    <p className="mt-1 text-xs text-primary">Unlocked {new Date(a.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card/60 px-4 py-3 text-center">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
