"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Activity,
  Flame,
  Droplets,
  Beef,
  Wheat,
  Nut,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { ProgressRing } from "@/components/shared/progress-ring";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LEVELS,
  ACTIVITY_META,
  GENDERS,
  GOALS,
  GOAL_META,
  EXPERIENCE_LEVELS,
  type ActivityLevel,
  type Gender,
  type Goal,
  type Experience,
} from "@/lib/enums";
import { calcNutritionTargets } from "@/lib/fitness";
import { saveOnboarding } from "@/server/actions/profile";

interface FormState {
  age: string;
  gender: Gender | "";
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  activityLevel: ActivityLevel | "";
  goal: Goal | "";
  experience: Experience;
}

const TOTAL_STEPS = 6;

export function OnboardingWizard({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    age: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    targetWeightKg: "",
    activityLevel: "",
    goal: "",
    experience: "beginner",
  });

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const targets = useMemo(() => {
    if (!form.age || !form.gender || !form.heightCm || !form.weightKg || !form.activityLevel || !form.goal)
      return null;
    return calcNutritionTargets({
      age: Number(form.age),
      gender: form.gender,
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      activityLevel: form.activityLevel,
      goal: form.goal,
    });
  }, [form]);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(form.age && form.gender);
      case 1:
        return Boolean(form.heightCm && form.weightKg);
      case 2:
        return Boolean(form.activityLevel);
      case 3:
        return Boolean(form.goal);
      case 4:
        return Boolean(form.targetWeightKg && form.experience);
      default:
        return true;
    }
  }, [step, form]);

  const next = () => {
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  async function finish() {
    setLoading(true);
    try {
      await saveOnboarding({
        age: Number(form.age),
        gender: form.gender as Gender,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        targetWeightKg: Number(form.targetWeightKg),
        activityLevel: form.activityLevel as ActivityLevel,
        goal: form.goal as Goal,
        experience: form.experience,
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="container flex min-h-dvh max-w-2xl flex-col py-8">
      <div className="mb-8 flex items-center justify-between">
        <Logo href={undefined} />
        <span className="text-sm text-muted-foreground">
          Step {step + 1} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-10 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-brand-gradient"
          initial={false}
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.5 }}
        />
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {step === 0 && (
              <Step title={`Hey ${name.split(" ")[0]}! 👋`} subtitle="Let's start with the basics.">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>How old are you?</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="28"
                      value={form.age}
                      onChange={(e) => set({ age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {GENDERS.map((g) => (
                        <ChoiceChip key={g} active={form.gender === g} onClick={() => set({ gender: g })}>
                          {g[0].toUpperCase() + g.slice(1)}
                        </ChoiceChip>
                      ))}
                    </div>
                  </div>
                </div>
              </Step>
            )}

            {step === 1 && (
              <Step title="Your measurements" subtitle="We use these to calculate your targets.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" inputMode="numeric" placeholder="178" value={form.heightCm} onChange={(e) => set({ heightCm: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" inputMode="decimal" placeholder="78" value={form.weightKg} onChange={(e) => set({ weightKg: e.target.value })} />
                  </div>
                </div>
                {targets && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl border bg-card/50 p-4">
                    <ProgressRing value={Math.min(100, (targets.bmi / 40) * 100)} size={64} strokeWidth={7}>
                      <span className="font-display text-sm font-bold">{targets.bmi}</span>
                    </ProgressRing>
                    <div>
                      <div className="text-sm font-medium">Your BMI is {targets.bmi}</div>
                      <div className="text-xs text-muted-foreground">{targets.bmiCategory} range</div>
                    </div>
                  </div>
                )}
              </Step>
            )}

            {step === 2 && (
              <Step title="How active are you?" subtitle="Be honest — it shapes your calorie needs.">
                <div className="space-y-3">
                  {ACTIVITY_LEVELS.map((a) => (
                    <SelectableCard
                      key={a}
                      active={form.activityLevel === a}
                      onClick={() => set({ activityLevel: a })}
                      icon={<Activity className="h-5 w-5" />}
                      title={ACTIVITY_META[a].label}
                      desc={ACTIVITY_META[a].description}
                    />
                  ))}
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step title="What's your goal?" subtitle="Your plan is built around this.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      onClick={() => set({ goal: g })}
                      className={cn(
                        "rounded-2xl border p-5 text-left transition-all",
                        form.goal === g
                          ? "border-primary bg-brand-gradient-soft shadow-glow"
                          : "hover:border-primary/40 hover:bg-accent/50"
                      )}
                    >
                      <div className="text-2xl">{GOAL_META[g].emoji}</div>
                      <div className="mt-2 font-display font-semibold">{GOAL_META[g].label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{GOAL_META[g].description}</div>
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {step === 4 && (
              <Step title="Almost there" subtitle="A target and your experience level.">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Target weight (kg)</Label>
                    <Input type="number" inputMode="decimal" placeholder="74" value={form.targetWeightKg} onChange={(e) => set({ targetWeightKg: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Training experience</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {EXPERIENCE_LEVELS.map((x) => (
                        <ChoiceChip key={x} active={form.experience === x} onClick={() => set({ experience: x })}>
                          {x[0].toUpperCase() + x.slice(1)}
                        </ChoiceChip>
                      ))}
                    </div>
                  </div>
                </div>
              </Step>
            )}

            {step === 5 && targets && (
              <Step title="Your personalized plan ✨" subtitle="Here's what we calculated for you.">
                <div className="flex flex-col items-center">
                  <ProgressRing value={100} size={150} strokeWidth={12}
                    gradientFrom="hsl(258 90% 66%)" gradientTo="hsl(330 90% 64%)">
                    <Flame className="mb-1 h-5 w-5 text-primary" />
                    <span className="font-display text-3xl font-bold">{targets.targetCalories}</span>
                    <span className="text-xs text-muted-foreground">kcal / day</span>
                  </ProgressRing>
                  <div className="mt-6 grid w-full grid-cols-3 gap-3">
                    <MacroPill icon={<Beef className="h-4 w-4" />} label="Protein" value={`${targets.proteinG}g`} color="text-rose-500" />
                    <MacroPill icon={<Wheat className="h-4 w-4" />} label="Carbs" value={`${targets.carbsG}g`} color="text-amber-500" />
                    <MacroPill icon={<Nut className="h-4 w-4" />} label="Fat" value={`${targets.fatG}g`} color="text-emerald-500" />
                  </div>
                  <div className="mt-3 grid w-full grid-cols-2 gap-3">
                    <MacroPill icon={<Droplets className="h-4 w-4" />} label="Water goal" value={`${(targets.waterGoalMl / 1000).toFixed(1)}L`} color="text-cyan-500" />
                    <MacroPill icon={<Activity className="h-4 w-4" />} label="Maintenance" value={`${targets.tdee} kcal`} color="text-violet-500" />
                  </div>
                </div>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 0 || loading} className={cn(step === 0 && "invisible")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < TOTAL_STEPS - 1 ? (
          <Button variant="gradient" onClick={next} disabled={!canAdvance}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="gradient" onClick={finish} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Start training
          </Button>
        )}
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-balance">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function ChoiceChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border py-3 text-sm font-medium transition-all",
        active ? "border-primary bg-brand-gradient-soft text-primary shadow-glow" : "hover:border-primary/40 hover:bg-accent/50"
      )}
    >
      {children}
    </button>
  );
}

function SelectableCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
        active ? "border-primary bg-brand-gradient-soft shadow-glow" : "hover:border-primary/40 hover:bg-accent/50"
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", active ? "bg-brand-gradient text-white" : "bg-secondary text-muted-foreground")}>
        {icon}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}

function MacroPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border bg-card/50 p-3 text-center">
      <div className={cn("mx-auto flex h-8 w-8 items-center justify-center", color)}>{icon}</div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
