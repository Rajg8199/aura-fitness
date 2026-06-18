"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Exercise } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseMedia } from "./exercise-media";
import { EmptyState } from "@/components/shared/empty-state";
import { Dumbbell } from "lucide-react";
import { MUSCLE_GROUPS, MUSCLE_LABELS } from "@/lib/enums";
import { cn } from "@/lib/utils";

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesGroup = group === "all" || e.muscleGroup === group;
      const matchesQ = !q || e.name.toLowerCase().includes(q.toLowerCase());
      return matchesGroup && matchesQ;
    });
  }, [exercises, q, group]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 28 exercises…" className="pl-10" />
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterChip active={group === "all"} onClick={() => setGroup("all")}>All</FilterChip>
        {MUSCLE_GROUPS.map((g) => (
          <FilterChip key={g} active={group === g} onClick={() => setGroup(g)}>
            {MUSCLE_LABELS[g]}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No exercises found" description="Try a different search or muscle group." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <Card key={ex.id} className="card-hover cursor-pointer overflow-hidden" onClick={() => setSelected(ex)}>
              <ExerciseMedia src={ex.gifUrl ?? ex.imageUrl} alt={ex.name} muscleGroup={ex.muscleGroup} rounded="" className="aspect-[4/3] w-full" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold leading-tight">{ex.name}</h3>
                  <Badge variant="secondary" className="shrink-0 capitalize">{ex.difficulty}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="default">{MUSCLE_LABELS[ex.muscleGroup]}</Badge>
                  <Badge variant="outline" className="capitalize">{ex.equipment}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <ExerciseMedia src={selected.gifUrl ?? selected.imageUrl} alt={selected.name} muscleGroup={selected.muscleGroup} className="aspect-video w-full" />
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="default">{MUSCLE_LABELS[selected.muscleGroup]}</Badge>
                <Badge variant="outline" className="capitalize">{selected.equipment}</Badge>
                <Badge variant="secondary" className="capitalize">{selected.difficulty}</Badge>
              </div>
              {selected.instructions && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">How to perform</h4>
                  <ol className="space-y-2">
                    {selected.instructions.split("\n").map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gradient-soft text-xs font-semibold text-primary">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
        active ? "border-primary bg-brand-gradient text-white shadow-glow" : "hover:border-primary/40 hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
