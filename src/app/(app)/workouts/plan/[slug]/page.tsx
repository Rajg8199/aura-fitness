import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPlanDetail } from "@/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StartDayButton } from "@/components/workouts/start-day-button";
import { MUSCLE_LABELS } from "@/lib/enums";

export default async function PlanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = await getPlanDetail(slug);
  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href="/workouts"><ArrowLeft className="h-4 w-4" /> Back to workouts</Link>
      </Button>

      <PageHeader title={plan.name} description={plan.description ?? undefined}>
        <Badge variant="secondary" className="capitalize">{plan.level}</Badge>
        <Badge variant="outline">{plan.daysPerWeek} days/week</Badge>
      </PageHeader>

      <div className="space-y-5">
        {plan.days.map((day) => (
          <Card key={day.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{day.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{day.focus}</p>
              </div>
              <StartDayButton planDayId={day.id} size="sm" />
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {day.exercises.map((pe, i) => (
                  <div key={pe.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">{i + 1}</span>
                      <div>
                        <div className="font-medium">{pe.exercise.name}</div>
                        <div className="text-xs text-muted-foreground">{MUSCLE_LABELS[pe.exercise.muscleGroup]}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{pe.sets} × {pe.reps}</div>
                      <div className="text-xs text-muted-foreground">{pe.restSec}s rest</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
