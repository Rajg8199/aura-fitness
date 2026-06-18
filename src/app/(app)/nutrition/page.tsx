import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDiaryForDay, getProfile, getWaterForDay } from "@/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { NutritionView } from "@/components/nutrition/nutrition-view";
import { WaterWidget } from "@/components/dashboard/water-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MEAL_TYPES, MEAL_META } from "@/lib/enums";

export const metadata = { title: "Nutrition" };

export default async function NutritionPage() {
  const session = await auth();
  const userId = session!.user.id;
  const today = new Date();

  const [profile, entries, water, foods] = await Promise.all([
    getProfile(userId),
    getDiaryForDay(userId, today),
    getWaterForDay(userId, today),
    prisma.foodItem.findMany({
      where: { OR: [{ isPublic: true }, { userId }] },
      orderBy: { name: "asc" },
    }),
  ]);

  const targets = {
    calories: profile?.targetCalories ?? 2200,
    protein: profile?.proteinG ?? 150,
    carbs: profile?.carbsG ?? 250,
    fat: profile?.fatG ?? 70,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition"
        description={today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NutritionView entries={entries} foods={foods} targets={targets} />
        </div>
        <div className="space-y-6">
          <WaterWidget initialMl={water} goalMl={profile?.waterGoalMl ?? 2500} />
          <Card>
            <CardHeader>
              <CardTitle>Suggested plan</CardTitle>
              <p className="text-sm text-muted-foreground">Targets split across your day</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {MEAL_TYPES.map((meal) => (
                <div key={meal} className="flex items-center justify-between rounded-xl bg-secondary/50 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span>{MEAL_META[meal].icon}</span>
                    <span className="text-sm font-medium">{MEAL_META[meal].label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{Math.round(targets.calories * MEAL_META[meal].calorieShare)} kcal</div>
                    <div className="text-xs text-muted-foreground">~{Math.round(targets.protein * MEAL_META[meal].calorieShare)}g protein</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
