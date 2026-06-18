import Anthropic from "@anthropic-ai/sdk";
import { GOAL_META, type Goal } from "./enums";

export interface CoachContext {
  name: string;
  goal?: string;
  age?: number | null;
  weightKg?: number | null;
  targetWeightKg?: number | null;
  targetCalories?: number | null;
  proteinG?: number | null;
  currentStreak?: number;
  level?: number;
  recentWeightTrend?: number; // kg/week
  caloriesToday?: number;
  proteinToday?: number;
  workoutsThisWeek?: number;
}

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildSystemPrompt(ctx: CoachContext): string {
  const goalLabel = ctx.goal ? GOAL_META[ctx.goal as Goal]?.label ?? ctx.goal : "general fitness";
  return [
    "You are Aura, an elite AI fitness and nutrition coach inside a premium health app.",
    "You are warm, motivating, concise, and evidence-based. You speak like a knowledgeable personal trainer who genuinely cares.",
    "Keep replies tight (2–5 short paragraphs or a compact list). Use the user's data to be specific. Use light emoji sparingly.",
    "Never give medical diagnoses; for medical concerns, advise consulting a professional.",
    "",
    "USER PROFILE:",
    `- Name: ${ctx.name}`,
    `- Goal: ${goalLabel}`,
    ctx.age ? `- Age: ${ctx.age}` : "",
    ctx.weightKg ? `- Current weight: ${ctx.weightKg}kg` : "",
    ctx.targetWeightKg ? `- Target weight: ${ctx.targetWeightKg}kg` : "",
    ctx.targetCalories ? `- Daily calorie target: ${ctx.targetCalories} kcal` : "",
    ctx.proteinG ? `- Daily protein target: ${ctx.proteinG}g` : "",
    typeof ctx.currentStreak === "number" ? `- Current streak: ${ctx.currentStreak} days` : "",
    typeof ctx.level === "number" ? `- Level: ${ctx.level}` : "",
    typeof ctx.recentWeightTrend === "number" ? `- Recent weight trend: ${ctx.recentWeightTrend > 0 ? "+" : ""}${ctx.recentWeightTrend}kg/week` : "",
    typeof ctx.caloriesToday === "number" ? `- Calories eaten today: ${ctx.caloriesToday} kcal` : "",
    typeof ctx.proteinToday === "number" ? `- Protein today: ${ctx.proteinToday}g` : "",
    typeof ctx.workoutsThisWeek === "number" ? `- Workouts this week: ${ctx.workoutsThisWeek}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const COACH_SUGGESTIONS = [
  "How am I progressing toward my goal?",
  "What should I eat to hit my protein target?",
  "Suggest a workout for today",
  "I'm feeling unmotivated — help",
  "Should I change my calories?",
  "How do I break a weight-loss plateau?",
];

export function isCoachLive() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Stream a coach reply from Claude. Throws if no API key. */
export async function streamCoachReply(
  ctx: CoachContext,
  history: CoachMessage[]
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("NO_API_KEY");
  const client = new Anthropic({ apiKey });
  return client.messages.stream({
    model: process.env.AI_COACH_MODEL || "claude-opus-4-8",
    max_tokens: 1024,
    system: buildSystemPrompt(ctx),
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });
}

/**
 * Rule-based fallback coach. Produces genuinely useful, personalized replies
 * so the chat works perfectly in demos without an API key.
 */
export function mockCoachReply(ctx: CoachContext, userMessage: string): string {
  const q = userMessage.toLowerCase();
  const name = ctx.name.split(" ")[0];
  const goalLabel = ctx.goal ? GOAL_META[ctx.goal as Goal]?.label ?? ctx.goal : "your goal";

  if (/progress|how am i|doing|track/.test(q)) {
    const trend = ctx.recentWeightTrend ?? 0;
    const dir = trend < 0 ? "down" : trend > 0 ? "up" : "holding steady";
    return `Great question, ${name}! 📊 You're trending ${dir}${trend ? ` at ${Math.abs(trend)}kg/week` : ""}, which is right in the healthy zone for ${goalLabel}.\n\nYou're on a ${ctx.currentStreak ?? 0}-day streak and level ${ctx.level ?? 1} — consistency is clearly your superpower. Keep logging daily and let's reassess in two weeks. Want me to suggest a small tweak to accelerate things?`;
  }
  if (/protein|macro|eat|food|meal|diet/.test(q)) {
    const left = Math.max(0, (ctx.proteinG ?? 150) - (ctx.proteinToday ?? 0));
    return `For ${goalLabel}, protein is your priority 🥩. Your target is ${ctx.proteinG ?? 150}g/day${ctx.proteinToday != null ? ` and you've had ${Math.round(ctx.proteinToday)}g, so ~${Math.round(left)}g to go` : ""}.\n\nEasy wins to close the gap:\n• A scoop of whey (~24g)\n• 150g chicken breast (~46g)\n• 200g Greek yogurt (~20g)\n• 2 whole eggs (~13g)\n\nSpread protein across 3–4 meals for best muscle protein synthesis.`;
  }
  if (/workout|train|exercise|gym|lift/.test(q)) {
    return `Let's get after it 💪. Based on your ${goalLabel} goal, here's a solid session for today:\n\n1. Compound first — Squat or Bench, 4×6–8\n2. A second compound — Row or Overhead Press, 3×8–10\n3. Two isolations — 3×12–15 each\n4. Finish with core, 3 sets\n\nKeep rest at 90–150s on compounds. Head to the Workouts tab and start a session so I can track your volume!`;
  }
  if (/motivat|unmotivat|tired|lazy|give up|hard|struggl/.test(q)) {
    return `I hear you, ${name}. Motivation comes and goes — systems are what win. 🌟\n\nYou've already built a ${ctx.currentStreak ?? 0}-day streak. Don't break the chain today. The deal: just show up for 10 minutes. No pressure to do more. Nine times out of ten, starting is the hardest part and you'll finish the whole thing.\n\nFuture-you is built by what present-you does in moments exactly like this. Let's go. 🔥`;
  }
  if (/calorie|deficit|surplus|change|adjust/.test(q)) {
    return `Smart to check in on this ⚖️. Your current target is ${ctx.targetCalories ?? 2200} kcal/day.\n\nThe rule of thumb: only adjust after 2–3 weeks of consistent data. If your weight has stalled for 2+ weeks and you're hitting your numbers, drop ~150 kcal (for fat loss) or add ~150 kcal (for gaining). Small, patient changes beat big swings every time.`;
  }
  if (/plateau|stall|stuck|not losing|not gaining/.test(q)) {
    return `Plateaus are normal — let's troubleshoot 🔍:\n\n1. Tighten tracking for a week (weigh portions; liquid calories count).\n2. Bump daily steps by ~2,000 — NEAT drives a lot of expenditure.\n3. Prioritize sleep (7–9h) and protein.\n4. If still stalled after 2 weeks, adjust calories by ~5%.\n\nProgress isn't linear. The scale lies day-to-day; the weekly average tells the truth.`;
  }
  return `Hey ${name}! 👋 I'm here to help with workouts, nutrition, recovery, and motivation — all tailored to your ${goalLabel} goal.\n\nTry asking about your progress, what to eat to hit your protein, or a workout for today. (Tip: add an ANTHROPIC_API_KEY to unlock my full conversational brain. Right now I'm running in fast offline mode.)`;
}
