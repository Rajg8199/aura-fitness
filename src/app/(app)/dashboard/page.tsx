import Link from "next/link";
import {
  Flame,
  Beef,
  Dumbbell,
  Target,
  TrendingDown,
  TrendingUp,
  Play,
  ArrowRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/server/queries";
import { GOAL_META, type Goal } from "@/lib/enums";
import { estimateGoalDate } from "@/lib/fitness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityRings } from "@/components/shared/activity-rings";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { AreaTrend } from "@/components/shared/charts";
import { WaterWidget } from "@/components/dashboard/water-widget";

export const metadata = { title: "Dashboard" };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const data = await getDashboardData(userId);
  const p = data.profile!;

  const calTarget = p.targetCalories ?? 2200;
  const calEaten = data.macros.calories;
  const calRemaining = Math.max(0, calTarget - calEaten);
  const calPct = (calEaten / calTarget) * 100;

  const proteinTarget = p.proteinG ?? 150;
  const proteinPct = (data.macros.protein / proteinTarget) * 100;

  const waterPct = (data.waterMl / p.waterGoalMl) * 100;

  const weeklyGoal = 4;
  const weeklyPct = (data.sessionsThisWeek / weeklyGoal) * 100;

  const goalMeta = GOAL_META[p.goal as Goal];
  const eta =
    p.targetWeightKg && p.weightKg && goalMeta
      ? estimateGoalDate(p.weightKg, p.targetWeightKg, (p.targetCalories ?? 0) - (p.tdee ?? 0))
      : null;

  const weightData = data.weights.map((w) => ({
    date: w.date.toISOString().slice(0, 10),
    weight: w.weightKg,
  }));
  const firstW = data.weights[0]?.weightKg;
  const lastW = data.weights[data.weights.length - 1]?.weightKg;
  const weightDelta = firstW && lastW ? +(lastW - firstW).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-up">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {session!.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            {goalMeta ? `${goalMeta.emoji} ${goalMeta.label}` : "Let's make today count."}
            {eta && ` · Goal by ${eta.date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/workouts"><Play className="h-4 w-4" /> Start workout</Link>
        </Button>
      </div>

      {/* Top stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Calories remaining"
          value={<AnimatedNumber value={calRemaining} />}
          sub={`${Math.round(calEaten)} / ${calTarget} kcal eaten`}
          accent="text-amber-500"
          iconBg="bg-amber-500/12"
        />
        <StatCard
          icon={Beef}
          label="Protein today"
          value={<><AnimatedNumber value={data.macros.protein} suffix="g" /></>}
          sub={`Target ${proteinTarget}g`}
          accent="text-rose-500"
          iconBg="bg-rose-500/12"
          trend={{ value: `${Math.round(proteinPct)}%`, positive: proteinPct >= 80 }}
        />
        <StatCard
          icon={Dumbbell}
          label="Workouts this week"
          value={<AnimatedNumber value={data.sessionsThisWeek} />}
          sub={`Goal ${weeklyGoal}/week`}
          accent="text-violet-500"
          iconBg="bg-violet-500/12"
        />
        <StatCard
          icon={p.goal === "weight_loss" ? TrendingDown : TrendingUp}
          label="Weight trend"
          value={<>{data.trend > 0 ? "+" : ""}{data.trend}<span className="text-base"> kg/wk</span></>}
          sub={`Now ${p.weightKg}kg · target ${p.targetWeightKg}kg`}
          accent="text-cyan-500"
          iconBg="bg-cyan-500/12"
        />
      </div>

      {/* Rings + water + weight chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity rings */}
        <Card className="flex flex-col items-center justify-center p-6">
          <CardTitle className="self-start">Today&apos;s rings</CardTitle>
          <div className="relative my-4 flex items-center justify-center">
            <ActivityRings
              size={180}
              rings={[
                { value: calPct, color: "hsl(348 100% 55%)" },
                { value: proteinPct, color: "hsl(90 80% 50%)" },
                { value: waterPct, color: "hsl(190 90% 50%)" },
              ]}
            />
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-3xl font-bold">{Math.round(calPct)}%</span>
              <span className="text-xs text-muted-foreground">calories</span>
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
            <div><div className="font-semibold text-[hsl(348_100%_55%)]">Calories</div><div className="text-muted-foreground">{Math.round(calPct)}%</div></div>
            <div><div className="font-semibold text-[hsl(90_80%_42%)]">Protein</div><div className="text-muted-foreground">{Math.round(proteinPct)}%</div></div>
            <div><div className="font-semibold text-[hsl(190_90%_45%)]">Water</div><div className="text-muted-foreground">{Math.round(waterPct)}%</div></div>
          </div>
        </Card>

        {/* Weight chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Weight trend</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Last {data.weights.length} entries</p>
            </div>
            <Badge variant={weightDelta <= 0 ? "success" : "warning"}>
              {weightDelta > 0 ? "+" : ""}{weightDelta} kg
            </Badge>
          </CardHeader>
          <CardContent>
            {weightData.length > 1 ? (
              <AreaTrend data={weightData} dataKey="weight" color="hsl(190 90% 50%)" unit="kg" height={220} />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                Log your weight to see your trend.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Macros + water + weekly goal */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <CardTitle>Macros</CardTitle>
          <div className="mt-5 space-y-4">
            <MacroBar label="Protein" value={data.macros.protein} target={proteinTarget} color="bg-rose-500" unit="g" />
            <MacroBar label="Carbs" value={data.macros.carbs} target={p.carbsG ?? 250} color="bg-amber-500" unit="g" />
            <MacroBar label="Fat" value={data.macros.fat} target={p.fatG ?? 70} color="bg-emerald-500" unit="g" />
          </div>
        </Card>

        <WaterWidget initialMl={data.waterMl} goalMl={p.waterGoalMl} />

        <Card className="p-5">
          <CardTitle>Weekly goal</CardTitle>
          <div className="mt-5 flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" strokeWidth="8" className="stroke-secondary" />
                <circle cx="40" cy="40" r="34" fill="none" strokeWidth="8" strokeLinecap="round"
                  className="stroke-primary" strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(1, weeklyPct / 100))} />
              </svg>
              <span className="absolute font-display text-lg font-bold">{data.sessionsThisWeek}/{weeklyGoal}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.sessionsThisWeek >= weeklyGoal
                ? "🎉 Weekly goal smashed!"
                : `${weeklyGoal - data.sessionsThisWeek} more workout${weeklyGoal - data.sessionsThisWeek === 1 ? "" : "s"} to hit your weekly goal.`}
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-5 w-full" asChild>
            <Link href="/achievements"><Trophy className="h-4 w-4" /> View achievements</Link>
          </Button>
        </Card>
      </div>

      {/* Coach CTA */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-brand-gradient-soft" />
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Ask your AI coach</h3>
              <p className="text-sm text-muted-foreground">Get personalized advice based on today&apos;s data.</p>
            </div>
          </div>
          <Button variant="gradient" asChild>
            <Link href="/coach">Open coach <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MacroBar({ label, value, target, color, unit }: { label: string; value: number; target: number; color: string; unit: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{Math.round(value)} / {Math.round(target)}{unit}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
