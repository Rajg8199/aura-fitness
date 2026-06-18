"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, UtensilsCrossed } from "lucide-react";
import type { FoodItem } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/shared/progress-ring";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { FoodSearchDialog } from "./food-search-dialog";
import { deleteDiaryEntry } from "@/server/actions/tracking";
import { MEAL_TYPES, MEAL_META, type MealType } from "@/lib/enums";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  mealType: string;
  customName: string | null;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodItem: { name: string } | null;
}

export function NutritionView({
  entries,
  foods,
  targets,
}: {
  entries: Entry[];
  foods: FoodItem[];
  targets: { calories: number; protein: number; carbs: number; fat: number };
}) {
  const [dialogMeal, setDialogMeal] = useState<MealType | null>(null);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calPct = (totals.calories / targets.calories) * 100;
  const remaining = Math.round(targets.calories - totals.calories);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-5">
            <ProgressRing value={calPct} size={120} strokeWidth={11}>
              <span className="font-display text-2xl font-bold">{Math.round(totals.calories)}</span>
              <span className="text-xs text-muted-foreground">/ {Math.round(targets.calories)}</span>
            </ProgressRing>
            <div>
              <div className="text-sm text-muted-foreground">Calories remaining</div>
              <div className={cn("font-display text-3xl font-bold", remaining < 0 ? "text-destructive" : "")}>
                <AnimatedNumber value={Math.abs(remaining)} />
              </div>
              <div className="text-xs text-muted-foreground">{remaining < 0 ? "over budget" : "left today"}</div>
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto">
            <MacroStat label="Protein" value={totals.protein} target={targets.protein} color="bg-rose-500" />
            <MacroStat label="Carbs" value={totals.carbs} target={targets.carbs} color="bg-amber-500" />
            <MacroStat label="Fat" value={totals.fat} target={targets.fat} color="bg-emerald-500" />
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <div className="space-y-4">
        {MEAL_TYPES.map((meal) => {
          const mealEntries = entries.filter((e) => e.mealType === meal);
          const mealCals = mealEntries.reduce((a, e) => a + e.calories, 0);
          return (
            <Card key={meal}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MEAL_META[meal].icon}</span>
                    <div>
                      <div className="font-display font-semibold">{MEAL_META[meal].label}</div>
                      <div className="text-xs text-muted-foreground">{Math.round(mealCals)} kcal</div>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setDialogMeal(meal)}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>

                {mealEntries.length > 0 && (
                  <div className="mt-3 divide-y">
                    {mealEntries.map((e) => (
                      <EntryRow key={e.id} entry={e} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {dialogMeal && (
        <FoodSearchDialog
          open={!!dialogMeal}
          onOpenChange={(o) => !o && setDialogMeal(null)}
          mealType={dialogMeal}
          foods={foods}
        />
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const [pending, start] = useTransition();
  return (
    <div className={cn("flex items-center justify-between py-2.5", pending && "opacity-40")}>
      <div>
        <div className="text-sm font-medium">{entry.foodItem?.name ?? entry.customName}</div>
        <div className="text-xs text-muted-foreground">
          {entry.servings}× · P{Math.round(entry.protein)} C{Math.round(entry.carbs)} F{Math.round(entry.fat)}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">{Math.round(entry.calories)}</span>
        <button onClick={() => start(() => { void deleteDiaryEntry(entry.id); })} className="text-muted-foreground transition-colors hover:text-destructive" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MacroStat({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="rounded-xl border bg-card/50 p-3 text-center">
      <div className="font-display text-lg font-bold">{Math.round(value)}</div>
      <div className="text-[10px] text-muted-foreground">/ {Math.round(target)}g {label}</div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
