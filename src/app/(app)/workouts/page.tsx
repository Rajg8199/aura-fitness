import { auth } from "@/lib/auth";
import { getWorkoutPlans, getExercises, getWorkoutHistory, getActiveSession } from "@/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { WorkoutsView } from "@/components/workouts/workouts-view";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play } from "lucide-react";

export const metadata = { title: "Workouts" };

export default async function WorkoutsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [plans, exercises, history, active] = await Promise.all([
    getWorkoutPlans(),
    getExercises(),
    getWorkoutHistory(userId),
    getActiveSession(userId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Workouts" description="Choose a plan, browse the library, or review your history." />

      {active && (
        <Card className="border-primary/40 bg-brand-gradient-soft">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="text-sm font-medium">Workout in progress</div>
              <div className="text-xs text-muted-foreground">{active.name} · resume where you left off</div>
            </div>
            <Button variant="gradient" asChild>
              <Link href={`/workouts/session/${active.id}`}><Play className="h-4 w-4" /> Resume</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <WorkoutsView
        plans={plans}
        exercises={exercises}
        history={history}
      />
    </div>
  );
}
