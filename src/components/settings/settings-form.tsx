"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, Bell, Dumbbell, Droplet, Utensils, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIVITY_LEVELS, ACTIVITY_META, GOALS, GOAL_META, type ActivityLevel, type Goal } from "@/lib/enums";
import { updateProfileSettings } from "@/server/actions/profile";
import { toggleReminder } from "@/server/actions/settings";

interface Reminder { id: string; type: string; label: string; time: string; enabled: boolean }

const REMINDER_ICONS: Record<string, React.ElementType> = {
  workout: Dumbbell, water: Droplet, meal: Utensils, weight: Scale,
};

export function SettingsForm({
  profile,
  reminders,
}: {
  profile: {
    age: number | null; heightCm: number | null; weightKg: number | null;
    targetWeightKg: number | null; activityLevel: string | null; goal: string | null;
    targetCalories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null;
    waterGoalMl: number;
  };
  reminders: Reminder[];
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    age: String(profile.age ?? ""),
    heightCm: String(profile.heightCm ?? ""),
    weightKg: String(profile.weightKg ?? ""),
    targetWeightKg: String(profile.targetWeightKg ?? ""),
    activityLevel: (profile.activityLevel ?? "moderate") as ActivityLevel,
    goal: (profile.goal ?? "maintenance") as Goal,
    waterGoalMl: String(profile.waterGoalMl),
  });

  function save() {
    start(async () => {
      await updateProfileSettings({
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        targetWeightKg: Number(form.targetWeightKg),
        activityLevel: form.activityLevel,
        goal: form.goal,
        waterGoalMl: Number(form.waterGoalMl),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Profile & goals</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age"><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
            <Field label="Height (cm)"><Input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} /></Field>
            <Field label="Weight (kg)"><Input type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} /></Field>
            <Field label="Target weight (kg)"><Input type="number" step="0.1" value={form.targetWeightKg} onChange={(e) => setForm({ ...form, targetWeightKg: e.target.value })} /></Field>
          </div>
          <Field label="Activity level">
            <Select value={form.activityLevel} onValueChange={(v) => setForm({ ...form, activityLevel: v as ActivityLevel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map((a) => <SelectItem key={a} value={a}>{ACTIVITY_META[a].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Goal">
            <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v as Goal })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GOALS.map((g) => <SelectItem key={g} value={g}>{GOAL_META[g].emoji} {GOAL_META[g].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Daily water goal (ml)"><Input type="number" step="250" value={form.waterGoalMl} onChange={(e) => setForm({ ...form, waterGoalMl: e.target.value })} /></Field>

          <Button variant="gradient" onClick={save} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved!" : "Save & recalculate targets"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current targets</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Target label="Calories" value={`${Math.round(profile.targetCalories ?? 0)}`} />
          <Target label="Protein" value={`${Math.round(profile.proteinG ?? 0)}g`} />
          <Target label="Carbs" value={`${Math.round(profile.carbsG ?? 0)}g`} />
          <Target label="Fat" value={`${Math.round(profile.fatG ?? 0)}g`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Reminders</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reminders.length === 0 && <p className="text-sm text-muted-foreground">No reminders configured.</p>}
          {reminders.map((r) => <ReminderRow key={r.id} reminder={r} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const [enabled, setEnabled] = useState(reminder.enabled);
  const [, start] = useTransition();
  const Icon = REMINDER_ICONS[reminder.type] ?? Bell;
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card"><Icon className="h-4 w-4 text-primary" /></div>
        <div>
          <div className="text-sm font-medium">{reminder.label}</div>
          <div className="text-xs text-muted-foreground">Daily at {reminder.time}</div>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={(v) => { setEnabled(v); start(() => { void toggleReminder(reminder.id, v); }); }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
function Target({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3 text-center">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
