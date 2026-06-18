"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Plus, Minus, Loader2, PencilLine } from "lucide-react";
import type { FoodItem } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MEAL_META, type MealType } from "@/lib/enums";
import { logFood, createCustomFood } from "@/server/actions/tracking";
import { cn } from "@/lib/utils";

export function FoodSearchDialog({
  open,
  onOpenChange,
  mealType,
  foods,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mealType: MealType;
  foods: FoodItem[];
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const [custom, setCustom] = useState(false);
  const [pending, start] = useTransition();

  const filtered = useMemo(
    () => foods.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 40),
    [foods, q]
  );

  function reset() {
    setQ("");
    setSelected(null);
    setServings(1);
    setCustom(false);
  }

  function add() {
    if (!selected) return;
    start(async () => {
      await logFood({
        foodItemId: selected.id,
        mealType,
        servings,
        calories: selected.calories * servings,
        protein: selected.protein * servings,
        carbs: selected.carbs * servings,
        fat: selected.fat * servings,
      });
      reset();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add to {MEAL_META[mealType].label}</DialogTitle>
          <DialogDescription>Search a food or create your own.</DialogDescription>
        </DialogHeader>

        {custom ? (
          <CustomFoodForm
            onCancel={() => setCustom(false)}
            onCreated={(f) => { setSelected(f); setCustom(false); }}
          />
        ) : selected ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card/50 p-4">
              <div className="font-display font-semibold">{selected.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Per serving ({selected.servingSize}{selected.servingUnit}): {Math.round(selected.calories)} kcal
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                <Macro label="Cal" value={Math.round(selected.calories * servings)} />
                <Macro label="P" value={+(selected.protein * servings).toFixed(1)} accent="text-rose-500" />
                <Macro label="C" value={+(selected.carbs * servings).toFixed(1)} accent="text-amber-500" />
                <Macro label="F" value={+(selected.fat * servings).toFixed(1)} accent="text-emerald-500" />
              </div>
            </div>
            <div>
              <Label>Servings</Label>
              <div className="mt-2 flex items-center gap-3">
                <Button size="icon" variant="outline" onClick={() => setServings((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))}><Minus className="h-4 w-4" /></Button>
                <Input type="number" step="0.5" value={servings} onChange={(e) => setServings(Math.max(0.5, Number(e.target.value)))} className="text-center" />
                <Button size="icon" variant="outline" onClick={() => setServings((s) => +(s + 0.5).toFixed(1))}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Back</Button>
              <Button variant="gradient" className="flex-1" onClick={add} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add food
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods…" className="pl-10" />
            </div>
            <div className="-mx-2 max-h-[40vh] space-y-1 overflow-y-auto px-2">
              {filtered.map((f) => (
                <button key={f.id} onClick={() => setSelected(f)} className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-accent">
                  <div>
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(f.calories)} kcal · P{Math.round(f.protein)} C{Math.round(f.carbs)} F{Math.round(f.fat)}
                    </div>
                  </div>
                  {!f.isPublic && <Badge variant="secondary">Custom</Badge>}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setCustom(true)}>
              <PencilLine className="h-4 w-4" /> Create custom food
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Macro({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 py-2">
      <div className={cn("font-display text-sm font-bold", accent)}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function CustomFoodForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (f: FoodItem) => void }) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const valid = form.name && form.calories;

  function submit() {
    start(async () => {
      const res = await createCustomFood({
        name: form.name,
        calories: Number(form.calories),
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      });
      if (res.success) onCreated(res.food as FoodItem);
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Food name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Homemade smoothie" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Calories</Label><Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></div>
        <div className="space-y-2"><Label>Protein (g)</Label><Input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} /></div>
        <div className="space-y-2"><Label>Carbs (g)</Label><Input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} /></div>
        <div className="space-y-2"><Label>Fat (g)</Label><Input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} /></div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button variant="gradient" className="flex-1" onClick={submit} disabled={!valid || pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create
        </Button>
      </div>
    </div>
  );
}
