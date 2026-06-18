import { auth } from "@/lib/auth";
import { getAnalytics } from "@/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaTrend, BarTrend, MultiLine, DonutChart, DONUT_COLORS } from "@/components/shared/charts";
import { MUSCLE_LABELS } from "@/lib/enums";
import { Activity, Dumbbell, Flame, TrendingUp } from "lucide-react";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  const data = await getAnalytics(session!.user.id);

  const avgCalories = Math.round(
    data.days.filter((d) => d.calories > 0).reduce((a, d) => a + d.calories, 0) /
      Math.max(1, data.days.filter((d) => d.calories > 0).length)
  );
  const avgProtein = Math.round(
    data.days.filter((d) => d.protein > 0).reduce((a, d) => a + d.protein, 0) /
      Math.max(1, data.days.filter((d) => d.protein > 0).length)
  );
  const totalWorkouts = data.totalSessions;
  const muscleData = data.muscleDistribution.map((m) => ({ name: MUSCLE_LABELS[m.name] ?? m.name, value: m.value }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Your last 30 days at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Mini icon={Flame} label="Avg calories" value={`${avgCalories || 0}`} color="text-amber-500" bg="bg-amber-500/12" />
        <Mini icon={Activity} label="Avg protein" value={`${avgProtein || 0}g`} color="text-rose-500" bg="bg-rose-500/12" />
        <Mini icon={Dumbbell} label="Workouts (30d)" value={`${totalWorkouts}`} color="text-violet-500" bg="bg-violet-500/12" />
        <Mini icon={TrendingUp} label="Active days" value={`${data.days.filter((d) => d.calories > 0 || d.workouts > 0).length}`} color="text-cyan-500" bg="bg-cyan-500/12" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Calorie intake</CardTitle></CardHeader>
          <CardContent><AreaTrend data={data.days} dataKey="calories" color="hsl(38 92% 55%)" /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Protein intake</CardTitle></CardHeader>
          <CardContent><BarTrend data={data.days} dataKey="protein" color="hsl(348 83% 60%)" /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Macros over time</CardTitle></CardHeader>
          <CardContent>
            <MultiLine
              data={data.days}
              lines={[
                { key: "protein", color: "hsl(348 83% 60%)", name: "Protein" },
                { key: "carbs", color: "hsl(38 92% 55%)", name: "Carbs" },
                { key: "fat", color: "hsl(152 69% 45%)", name: "Fat" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Weight trend</CardTitle></CardHeader>
          <CardContent>
            {data.weights.length > 1 ? (
              <AreaTrend data={data.weights.map((w) => ({ date: w.date, weight: w.weightKg }))} dataKey="weight" color="hsl(190 90% 50%)" unit="kg" />
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">Not enough data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Workout frequency</CardTitle></CardHeader>
          <CardContent><BarTrend data={data.days} dataKey="workouts" color="hsl(258 90% 66%)" /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Muscle group focus</CardTitle></CardHeader>
          <CardContent>
            {muscleData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="flex-1"><DonutChart data={muscleData} /></div>
                <div className="space-y-1.5">
                  {muscleData.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      {m.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">Complete workouts to see your split.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Mini({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string; color: string; bg: string }) {
  return (
    <Card className="p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="mt-4 font-display text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}
