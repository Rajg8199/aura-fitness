"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Plus,
  Timer,
  X,
  Flame,
  Trophy,
  Loader2,
  Dumbbell,
  StickyNote,
  Trash2,
} from "lucide-react";
import type { Exercise } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExerciseMedia } from "./exercise-media";
import { fireCelebration } from "@/components/shared/confetti";
import {
  updateSetLog,
  addSet,
  removeSet,
  completeSession,
  discardSession,
  addExerciseToSession,
} from "@/server/actions/workout";
import { MUSCLE_LABELS } from "@/lib/enums";
import { cn } from "@/lib/utils";

interface SetState {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}
interface ExState {
  id: string;
  exercise: Exercise;
  sets: SetState[];
}
interface Workout {
  id: string;
  name: string;
  exercises: { id: string; exercise: Exercise; sets: SetState[] }[];
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function SessionPlayer({ workout, library }: { workout: Workout; library: Exercise[] }) {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExState[]>(workout.exercises);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<{ volume: number; sets: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Rest countdown
  useEffect(() => {
    if (rest === null) return;
    if (rest <= 0) {
      setRest(null);
      return;
    }
    const t = setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const stats = useMemo(() => {
    const allSets = exercises.flatMap((e) => e.sets);
    const done = allSets.filter((s) => s.completed);
    const volume = done.reduce((a, s) => a + s.weightKg * s.reps, 0);
    return { total: allSets.length, done: done.length, volume };
  }, [exercises]);

  const progress = stats.total ? (stats.done / stats.total) * 100 : 0;

  function patchSet(exId: string, setId: string, patch: Partial<SetState>) {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exId ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) } : e
      )
    );
  }

  async function toggleComplete(exId: string, set: SetState) {
    const completed = !set.completed;
    patchSet(exId, set.id, { completed });
    await updateSetLog(set.id, { completed, reps: set.reps, weightKg: set.weightKg });
    if (completed) setRest(90);
  }

  async function persistSet(set: SetState) {
    await updateSetLog(set.id, { reps: set.reps, weightKg: set.weightKg });
  }

  async function doAddSet(exId: string) {
    const res = await addSet(exId);
    if (res.success && res.set) {
      setExercises((prev) =>
        prev.map((e) => (e.id === exId ? { ...e, sets: [...e.sets, res.set as SetState] } : e))
      );
    }
  }

  async function doRemoveSet(exId: string, setId: string) {
    setExercises((prev) =>
      prev.map((e) => (e.id === exId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e))
    );
    await removeSet(setId);
  }

  async function handleFinish() {
    setFinishing(true);
    const res = await completeSession(workout.id, elapsed);
    fireCelebration();
    setSummary({ volume: res.volume ?? stats.volume, sets: stats.done });
    setFinishing(false);
  }

  async function pickExercise(ex: Exercise) {
    setPickerOpen(false);
    const res = await addExerciseToSession(workout.id, ex.id);
    if (res.success) router.refresh();
  }

  return (
    <div className="-mt-6 space-y-5 pb-32">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">{workout.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {fmtTime(elapsed)}</span>
              <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> {Math.round(stats.volume).toLocaleString()} kg</span>
              <span>{stats.done}/{stats.total} sets</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => discardSession(workout.id)} aria-label="Discard">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div className="h-full rounded-full bg-brand-gradient" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((ex) => (
          <Card key={ex.id} className="overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <ExerciseMedia src={ex.exercise.gifUrl ?? ex.exercise.imageUrl} alt={ex.exercise.name} muscleGroup={ex.exercise.muscleGroup} className="h-14 w-14 shrink-0" rounded="rounded-lg" />
              <div className="min-w-0">
                <div className="truncate font-display font-semibold">{ex.exercise.name}</div>
                <Badge variant="secondary" className="mt-0.5">{MUSCLE_LABELS[ex.exercise.muscleGroup]}</Badge>
              </div>
            </div>

            {/* Set rows */}
            <div className="px-4 pb-2">
              <div className="grid grid-cols-[2.5rem_1fr_1fr_3rem] gap-2 px-1 pb-2 text-xs font-medium text-muted-foreground">
                <span>Set</span>
                <span>Weight (kg)</span>
                <span>Reps</span>
                <span className="text-center">Done</span>
              </div>
              {ex.sets.map((s) => (
                <div key={s.id} className={cn("group grid grid-cols-[2.5rem_1fr_1fr_3rem] items-center gap-2 rounded-lg py-1.5 transition-colors", s.completed && "bg-[hsl(var(--success))]/8")}>
                  <span className="pl-2 text-sm font-semibold text-muted-foreground">{s.setNumber}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={s.weightKg || ""}
                    placeholder="0"
                    className="h-9"
                    onChange={(e) => patchSet(ex.id, s.id, { weightKg: Number(e.target.value) })}
                    onBlur={() => persistSet(s)}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={s.reps || ""}
                    placeholder="0"
                    className="h-9"
                    onChange={(e) => patchSet(ex.id, s.id, { reps: Number(e.target.value) })}
                    onBlur={() => persistSet(s)}
                  />
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toggleComplete(ex.id, s)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
                        s.completed ? "border-transparent bg-[hsl(var(--success))] text-white" : "hover:border-primary"
                      )}
                      aria-label="Complete set"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 py-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => doAddSet(ex.id)}>
                  <Plus className="h-4 w-4" /> Add set
                </Button>
                {ex.sets.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => doRemoveSet(ex.id, ex.sets.at(-1)!.id)}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4" /> Add exercise
        </Button>
      </div>

      {/* Rest timer bar */}
      <AnimatePresence>
        {rest !== null && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-0 bottom-20 z-30 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-4 rounded-2xl border bg-card/90 p-3 pl-5 shadow-glow-lg backdrop-blur-xl lg:bottom-6"
          >
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Rest</div>
                <div className="font-display text-xl font-bold tabular-nums">{fmtTime(rest)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setRest((r) => (r ?? 0) + 30)}>+30s</Button>
              <Button size="sm" variant="outline" onClick={() => setRest(null)}>Skip</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish bar */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border/50 bg-background/90 p-3 backdrop-blur-xl lg:bottom-0 lg:left-64">
        <div className="container max-w-6xl px-1">
          <Button variant="gradient" size="lg" className="w-full" onClick={handleFinish} disabled={finishing || stats.done === 0}>
            {finishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            Finish workout
          </Button>
        </div>
      </div>

      {/* Exercise picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add an exercise</DialogTitle>
            <DialogDescription>Pick from the library to add to this session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            {library.map((ex) => (
              <button key={ex.id} onClick={() => pickExercise(ex)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary"><Dumbbell className="h-4 w-4 text-muted-foreground" /></div>
                <div>
                  <div className="text-sm font-medium">{ex.name}</div>
                  <div className="text-xs text-muted-foreground">{MUSCLE_LABELS[ex.muscleGroup]}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion summary */}
      <Dialog open={!!summary} onOpenChange={(o) => { if (!o) { router.push("/dashboard"); router.refresh(); } }}>
        <DialogContent className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Workout complete! 🎉</DialogTitle>
            <DialogDescription className="text-center">Crushed it. Here&apos;s your session summary.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2">
            <Stat label="Time" value={fmtTime(elapsed)} />
            <Stat label="Sets" value={String(summary?.sets ?? 0)} />
            <Stat label="Volume" value={`${Math.round(summary?.volume ?? 0).toLocaleString()}kg`} />
          </div>
          <Badge variant="gradient" className="mx-auto"><StickyNote className="h-3.5 w-3.5" /> +100 XP earned</Badge>
          <Button variant="gradient" className="mt-2 w-full" onClick={() => { router.push("/dashboard"); router.refresh(); }}>
            Back to dashboard
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
