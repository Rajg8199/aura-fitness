import Link from "next/link";
import {
  Activity,
  Apple,
  BarChart3,
  Bot,
  Dumbbell,
  Flame,
  HeartPulse,
  LineChart,
  Sparkles,
  Trophy,
  Droplets,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const features = [
  { icon: Bot, title: "AI Coach", desc: "A personal coach that analyzes your data and adapts your plan in real time.", color: "text-violet-500" },
  { icon: Dumbbell, title: "Smart Workouts", desc: "Auto-generated PPL, Upper/Lower and Arnold splits with a guided session player.", color: "text-fuchsia-500" },
  { icon: Apple, title: "Nutrition Tracking", desc: "Macro-aware meal plans, instant food search, and a beautiful diet diary.", color: "text-emerald-500" },
  { icon: LineChart, title: "Progress Insights", desc: "Weight trends, body measurements, photos, and before/after comparisons.", color: "text-cyan-500" },
  { icon: Trophy, title: "Gamification", desc: "Streaks, XP, levels and achievements that make consistency addictive.", color: "text-amber-500" },
  { icon: BarChart3, title: "Deep Analytics", desc: "Calorie, protein and volume trends with stunning interactive charts.", color: "text-rose-500" },
];

const steps = [
  { n: "01", title: "Tell us your goal", desc: "Answer a few questions and we calculate your calories, macros and water goal instantly." },
  { n: "02", title: "Follow your plan", desc: "Train with guided sessions, log meals in seconds, and track every drop of progress." },
  { n: "03", title: "Get coached & win", desc: "Your AI coach reviews your data weekly and keeps you motivated to the finish line." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-mesh opacity-80" />
        <div className="absolute inset-0 -z-10 bg-grid" />
        <div className="container flex flex-col items-center py-24 text-center sm:py-32">
          <Badge variant="gradient" className="mb-6 animate-fade-up px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Claude AI
          </Badge>
          <h1 className="max-w-4xl animate-fade-up font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl md:text-7xl">
            Your personal{" "}
            <span className="text-gradient">AI fitness coach</span>{" "}
            in your pocket
          </h1>
          <p className="mt-6 max-w-2xl animate-fade-up text-lg text-muted-foreground animation-delay-200 text-balance">
            Track workouts, nail your nutrition, and watch your progress compound — with a coach
            that actually knows you. Aura turns your goals into a plan, and your plan into results.
          </p>
          <div className="mt-9 flex animate-fade-up flex-col gap-3 animation-delay-400 sm:flex-row">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/sign-up">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Try the demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · demo@aura.fit / demo1234
          </p>

          {/* Floating stat cards */}
          <div className="relative mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Flame, label: "Day streak", value: "12", color: "text-amber-500" },
              { icon: Activity, label: "Workouts", value: "248", color: "text-violet-500" },
              { icon: HeartPulse, label: "Avg protein", value: "172g", color: "text-rose-500" },
              { icon: Droplets, label: "Hydration", value: "98%", color: "text-cyan-500" },
            ].map((s, i) => (
              <Card key={i} glass className="animate-fade-up p-4 text-left" style={{ animationDelay: `${200 + i * 100}ms` }}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div className="mt-3 font-display text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Everything you need</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            One app for your entire fitness journey
          </h2>
          <p className="mt-4 text-muted-foreground text-balance">
            From your first rep to your goal physique — Aura brings training, nutrition, recovery and
            motivation into one beautiful, intelligent experience.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="card-hover group p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-brand-gradient-soft">
                <f.icon className={`h-6 w-6 ${f.color}`} />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/40 bg-secondary/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">How it works</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Results in three simple steps
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="font-display text-5xl font-extrabold text-gradient">{s.n}</div>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Start free. Upgrade when you&apos;re ready.
          </h2>
        </div>
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          <Card className="p-8">
            <h3 className="font-display text-xl font-semibold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">Everything to get started</p>
            <div className="mt-5 font-display text-4xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
            <ul className="mt-6 space-y-3 text-sm">
              {["Workout & nutrition tracking", "Weight & progress charts", "Streaks & achievements", "Rule-based AI coach"].map((x) => (
                <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-[hsl(var(--success))]" /> {x}</li>
              ))}
            </ul>
            <Button variant="outline" className="mt-8 w-full" asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </Card>
          <Card className="relative overflow-hidden border-primary/40 p-8 shadow-glow">
            <div className="absolute inset-0 -z-10 bg-brand-gradient-soft" />
            <Badge variant="gradient" className="absolute right-6 top-6">Most popular</Badge>
            <h3 className="font-display text-xl font-semibold">Pro</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your full AI coaching experience</p>
            <div className="mt-5 font-display text-4xl font-bold">$9<span className="text-base font-normal text-muted-foreground">/mo</span></div>
            <ul className="mt-6 space-y-3 text-sm">
              {["Everything in Free", "Conversational Claude AI coach", "Auto meal-plan generation", "Advanced analytics & exports", "Priority support"].map((x) => (
                <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {x}</li>
              ))}
            </ul>
            <Button variant="gradient" className="mt-8 w-full" asChild>
              <Link href="/sign-up">Start 14-day trial</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-28">
        <Card className="relative overflow-hidden p-12 text-center">
          <div className="absolute inset-0 -z-10 bg-mesh opacity-90" />
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Your transformation starts today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join Aura and get a plan built around your body, your goals, and your life.
          </p>
          <Button size="lg" variant="gradient" className="mt-8" asChild>
            <Link href="/sign-up">Create your free account <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </Card>
      </section>
    </>
  );
}
