"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  ChevronDown,
  Loader2,
  Clock,
  Layers,
  Dumbbell,
  CalendarDays,
  Plus,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ExerciseLibrary } from "./exercise-library";
import { startSessionFromPlanDay, startEmptySession } from "@/server/actions/workout";
import { cn } from "@/lib/utils";
import type { Exercise } from "@prisma/client";

type PlanWithDays = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: string;
  split: string;
  daysPerWeek: number;
  days: { id: string; name: string; focus: string | null; _count: { exercises: number } }[];
};

type HistoryItem = {
  id: string;
  name: string;
  completedAt: Date | null;
  durationSec: number;
  totalVolume: number;
  planDay: { name: string } | null;
  _count: { exercises: number };
};

export function WorkoutsView({
  plans,
  exercises,
  history,
}: {
  plans: PlanWithDays[];
  exercises: Exercise[];
  history: HistoryItem[];
}) {
  return (
    <Tabs defaultValue="plans">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="plans" className="flex-1 sm:flex-none"><Layers className="h-4 w-4" /> Plans</TabsTrigger>
        <TabsTrigger value="library" className="flex-1 sm:flex-none"><Dumbbell className="h-4 w-4" /> Library</TabsTrigger>
        <TabsTrigger value="history" className="flex-1 sm:flex-none"><CalendarDays className="h-4 w-4" /> History</TabsTrigger>
      </TabsList>

      <TabsContent value="plans">
        <div className="mb-4 flex justify-end">
          <QuickStartButton />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      </TabsContent>

      <TabsContent value="library">
        <ExerciseLibrary exercises={exercises} />
      </TabsContent>

      <TabsContent value="history">
        {history.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            description="Start your first session from a plan and it'll show up here."
          />
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <Card key={h.id} className="card-hover">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient-soft">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.completedAt && new Date(h.completedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}{h._count.exercises} exercises
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {Math.round(h.durationSec / 60)}m</div>
                    <div className="font-semibold">{Math.round(h.totalVolume).toLocaleString()} kg</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function QuickStartButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" onClick={() => start(() => startEmptySession())} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      Quick start (empty)
    </Button>
  );
}

function PlanCard({ plan }: { plan: PlanWithDays }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
            <Badge variant="secondary" className="capitalize">{plan.level}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
            <span>{plan.daysPerWeek} days/week</span>
            <span>·</span>
            <span className="uppercase">{plan.split.replace("_", " ")}</span>
          </div>
        </div>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t px-5 py-4">
              {plan.days.map((day) => (
                <DayRow key={day.id} day={day} />
              ))}
              <Button variant="link" size="sm" asChild className="px-0">
                <Link href={`/workouts/plan/${plan.slug}`}>View full plan →</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function DayRow({ day }: { day: { id: string; name: string; focus: string | null; _count: { exercises: number } } }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
      <div>
        <div className="font-medium">{day.name}</div>
        <div className="text-xs text-muted-foreground">{day.focus} · {day._count.exercises} exercises</div>
      </div>
      <Button size="sm" variant="gradient" onClick={() => start(() => startSessionFromPlanDay(day.id))} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Start
      </Button>
    </div>
  );
}
