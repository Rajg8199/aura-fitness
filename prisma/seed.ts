/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const day = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};
const rand = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 10) / 10;

// ── Exercise library ─────────────────────────────────────
type Ex = {
  name: string;
  muscleGroup: string;
  secondary?: string;
  equipment?: string;
  difficulty?: string;
  category?: string;
  description: string;
  instructions: string;
};

const EXERCISES: Ex[] = [
  // Chest
  { name: "Barbell Bench Press", muscleGroup: "chest", secondary: "triceps,shoulders", equipment: "barbell", difficulty: "intermediate", description: "The king of upper-body pressing movements for building chest mass and strength.", instructions: "Lie flat on the bench, grip slightly wider than shoulders.\nLower the bar to mid-chest with control.\nDrive the bar up explosively, keeping shoulder blades retracted." },
  { name: "Incline Dumbbell Press", muscleGroup: "chest", secondary: "shoulders,triceps", equipment: "dumbbell", difficulty: "beginner", description: "Targets the upper chest for a fuller, more balanced look.", instructions: "Set bench to 30°.\nPress dumbbells up and slightly together.\nLower until you feel a stretch in the upper chest." },
  { name: "Push-Up", muscleGroup: "chest", secondary: "triceps,core", equipment: "bodyweight", difficulty: "beginner", description: "A foundational bodyweight push for chest, triceps and core stability.", instructions: "Hands under shoulders, body in a straight line.\nLower until elbows reach ~90°.\nPush back up, bracing your core." },
  { name: "Cable Fly", muscleGroup: "chest", secondary: "shoulders", equipment: "cable", difficulty: "intermediate", description: "Constant-tension isolation to carve out chest definition.", instructions: "Set pulleys high, slight forward lean.\nBring handles together in an arc.\nSqueeze, then return slowly." },
  // Back
  { name: "Deadlift", muscleGroup: "back", secondary: "legs,core", equipment: "barbell", difficulty: "advanced", description: "Full posterior-chain builder and the ultimate test of total-body strength.", instructions: "Bar over mid-foot, hinge and grip.\nBrace, drive through the floor.\nLock out hips and knees together, then lower with control." },
  { name: "Pull-Up", muscleGroup: "back", secondary: "arms", equipment: "bodyweight", difficulty: "intermediate", description: "The benchmark for upper-body pulling strength and a wide back.", instructions: "Hang with hands just outside shoulders.\nPull chest toward the bar.\nLower under control to a full stretch." },
  { name: "Bent-Over Barbell Row", muscleGroup: "back", secondary: "arms,core", equipment: "barbell", difficulty: "intermediate", description: "Builds thickness through the mid-back and lats.", instructions: "Hinge to ~45°, flat back.\nRow the bar to your lower ribs.\nSqueeze shoulder blades, lower slowly." },
  { name: "Lat Pulldown", muscleGroup: "back", secondary: "arms", equipment: "cable", difficulty: "beginner", description: "Accessible vertical pull to develop lat width.", instructions: "Grip wide, lean back slightly.\nPull the bar to your upper chest.\nControl the return, feeling the lats stretch." },
  { name: "Seated Cable Row", muscleGroup: "back", secondary: "arms", equipment: "cable", difficulty: "beginner", description: "Horizontal pull for mid-back thickness and posture.", instructions: "Sit tall, slight knee bend.\nDrive elbows back, squeeze.\nReturn with a controlled stretch." },
  // Legs
  { name: "Barbell Back Squat", muscleGroup: "legs", secondary: "core", equipment: "barbell", difficulty: "intermediate", description: "The premier lower-body strength and mass builder.", instructions: "Bar on upper traps, brace hard.\nDescend until hips below knees.\nDrive up through mid-foot." },
  { name: "Romanian Deadlift", muscleGroup: "legs", secondary: "back", equipment: "barbell", difficulty: "intermediate", description: "Hamstring and glute developer with a big stretch.", instructions: "Soft knees, hinge at the hips.\nLower the bar along your legs.\nDrive hips forward to stand." },
  { name: "Leg Press", muscleGroup: "legs", equipment: "machine", difficulty: "beginner", description: "High-load quad and glute work with a stable, joint-friendly path.", instructions: "Feet shoulder-width on the platform.\nLower until knees ~90°.\nPress without locking out hard." },
  { name: "Walking Lunge", muscleGroup: "legs", secondary: "core", equipment: "dumbbell", difficulty: "beginner", description: "Unilateral builder for balance and single-leg strength.", instructions: "Step forward into a lunge.\nDrop the back knee toward the floor.\nPush through the front heel into the next step." },
  { name: "Standing Calf Raise", muscleGroup: "legs", equipment: "machine", difficulty: "beginner", description: "Targets the calves through a full range.", instructions: "Balls of feet on the platform.\nRise as high as possible.\nLower for a deep stretch." },
  // Shoulders
  { name: "Overhead Press", muscleGroup: "shoulders", secondary: "triceps,core", equipment: "barbell", difficulty: "intermediate", description: "Builds round, powerful shoulders and overhead strength.", instructions: "Bar at shoulders, brace glutes and core.\nPress overhead, head through at lockout.\nLower under control." },
  { name: "Dumbbell Lateral Raise", muscleGroup: "shoulders", equipment: "dumbbell", difficulty: "beginner", description: "Isolation for the side delts and that capped look.", instructions: "Slight bend in elbows.\nRaise to shoulder height.\nLower slowly, no swinging." },
  { name: "Face Pull", muscleGroup: "shoulders", secondary: "back", equipment: "cable", difficulty: "beginner", description: "Rear-delt and upper-back health movement for posture.", instructions: "Rope at face height.\nPull toward your forehead, elbows high.\nSqueeze rear delts and return." },
  // Arms
  { name: "Barbell Biceps Curl", muscleGroup: "arms", equipment: "barbell", difficulty: "beginner", description: "Classic mass builder for the biceps.", instructions: "Elbows pinned to sides.\nCurl the bar up.\nLower slowly without swinging." },
  { name: "Dumbbell Hammer Curl", muscleGroup: "arms", equipment: "dumbbell", difficulty: "beginner", description: "Hits the brachialis for thicker-looking arms.", instructions: "Neutral grip throughout.\nCurl up, keep elbows still.\nLower with control." },
  { name: "Triceps Rope Pushdown", muscleGroup: "arms", equipment: "cable", difficulty: "beginner", description: "Triceps isolation with constant tension.", instructions: "Elbows tucked.\nPush down and spread the rope.\nReturn slowly to the top." },
  { name: "Overhead Triceps Extension", muscleGroup: "arms", equipment: "dumbbell", difficulty: "beginner", description: "Emphasizes the long head of the triceps.", instructions: "Hold one dumbbell overhead.\nLower behind your head.\nExtend back up, elbows pointing forward." },
  // Core
  { name: "Plank", muscleGroup: "core", equipment: "bodyweight", difficulty: "beginner", description: "Anti-extension core stability staple.", instructions: "Forearms down, body straight.\nBrace abs and glutes.\nHold without letting hips sag." },
  { name: "Hanging Leg Raise", muscleGroup: "core", equipment: "bodyweight", difficulty: "intermediate", description: "Lower-ab focused movement with a strong grip demand.", instructions: "Hang from a bar.\nRaise legs to parallel or higher.\nLower slowly, no swing." },
  { name: "Cable Crunch", muscleGroup: "core", equipment: "cable", difficulty: "beginner", description: "Loaded ab flexion for visible definition.", instructions: "Kneel under a rope.\nCrunch down, rounding the spine.\nReturn with control." },
  // Cardio / conditioning
  { name: "Treadmill Run", muscleGroup: "cardio", category: "cardio", equipment: "machine", difficulty: "beginner", description: "Steady-state cardio for heart health and calorie burn.", instructions: "Warm up 5 min.\nHold a conversational-to-moderate pace.\nCool down and stretch." },
  { name: "Rowing Machine", muscleGroup: "cardio", category: "cardio", secondary: "back,legs", equipment: "machine", difficulty: "beginner", description: "Full-body, low-impact conditioning.", instructions: "Drive with the legs first.\nThen lean back and pull.\nReturn arms, body, legs in order." },
  { name: "Jump Rope", muscleGroup: "cardio", category: "plyometric", equipment: "bodyweight", difficulty: "beginner", description: "Coordination and conditioning in a tiny footprint.", instructions: "Small wrist turns.\nStay light on the balls of your feet.\nKeep a steady rhythm." },
  { name: "Burpee", muscleGroup: "full_body", category: "plyometric", secondary: "chest,legs,core", equipment: "bodyweight", difficulty: "intermediate", description: "Brutal full-body conditioning movement.", instructions: "Squat, kick back to a plank.\nPerform a push-up.\nJump feet in and explode up." },
];

// ── Foods ────────────────────────────────────────────────
type Food = { name: string; brand?: string; cal: number; p: number; c: number; f: number; cat: string; serving?: number; unit?: string };
const FOODS: Food[] = [
  { name: "Chicken Breast (grilled)", cal: 165, p: 31, c: 0, f: 3.6, cat: "protein" },
  { name: "Whole Eggs", cal: 143, p: 13, c: 1.1, f: 9.5, cat: "protein" },
  { name: "Egg Whites", cal: 52, p: 11, c: 0.7, f: 0.2, cat: "protein" },
  { name: "Greek Yogurt (plain, 0%)", cal: 59, p: 10, c: 3.6, f: 0.4, cat: "dairy" },
  { name: "Whey Protein (1 scoop)", cal: 120, p: 24, c: 3, f: 1.5, cat: "protein", serving: 30, unit: "g" },
  { name: "Salmon Fillet", cal: 208, p: 20, c: 0, f: 13, cat: "protein" },
  { name: "Lean Ground Beef (90/10)", cal: 176, p: 20, c: 0, f: 10, cat: "protein" },
  { name: "Tofu (firm)", cal: 144, p: 17, c: 3, f: 9, cat: "protein" },
  { name: "Lentils (cooked)", cal: 116, p: 9, c: 20, f: 0.4, cat: "protein" },
  { name: "White Rice (cooked)", cal: 130, p: 2.7, c: 28, f: 0.3, cat: "carb" },
  { name: "Brown Rice (cooked)", cal: 123, p: 2.7, c: 26, f: 1, cat: "carb" },
  { name: "Oats (dry)", cal: 389, p: 17, c: 66, f: 7, cat: "carb" },
  { name: "Sweet Potato", cal: 86, p: 1.6, c: 20, f: 0.1, cat: "carb" },
  { name: "Whole Wheat Bread", cal: 247, p: 13, c: 41, f: 3.4, cat: "carb" },
  { name: "Banana", cal: 89, p: 1.1, c: 23, f: 0.3, cat: "fruit" },
  { name: "Apple", cal: 52, p: 0.3, c: 14, f: 0.2, cat: "fruit" },
  { name: "Blueberries", cal: 57, p: 0.7, c: 14, f: 0.3, cat: "fruit" },
  { name: "Broccoli", cal: 34, p: 2.8, c: 7, f: 0.4, cat: "veg" },
  { name: "Spinach", cal: 23, p: 2.9, c: 3.6, f: 0.4, cat: "veg" },
  { name: "Avocado", cal: 160, p: 2, c: 9, f: 15, cat: "fat" },
  { name: "Almonds", cal: 579, p: 21, c: 22, f: 50, cat: "fat" },
  { name: "Peanut Butter", cal: 588, p: 25, c: 20, f: 50, cat: "fat" },
  { name: "Olive Oil", cal: 884, p: 0, c: 0, f: 100, cat: "fat" },
  { name: "Cottage Cheese (low-fat)", cal: 72, p: 12, c: 3, f: 1, cat: "dairy" },
  { name: "Milk (2%)", cal: 50, p: 3.3, c: 4.8, f: 2, cat: "dairy" },
  { name: "Quinoa (cooked)", cal: 120, p: 4.4, c: 21, f: 1.9, cat: "carb" },
  { name: "Tuna (canned in water)", cal: 116, p: 26, c: 0, f: 1, cat: "protein" },
  { name: "Protein Bar", brand: "Generic", cal: 350, p: 20, c: 40, f: 12, cat: "snack", serving: 1, unit: "bar" },
  { name: "Dark Chocolate (85%)", cal: 599, p: 8, c: 30, f: 50, cat: "snack" },
  { name: "Orange", cal: 47, p: 0.9, c: 12, f: 0.1, cat: "fruit" },
];

async function main() {
  console.log("🌱  Seeding Aura…");

  // Clean (idempotent dev seed)
  await prisma.$transaction([
    prisma.setLog.deleteMany(),
    prisma.sessionExercise.deleteMany(),
    prisma.workoutSession.deleteMany(),
    prisma.planExercise.deleteMany(),
    prisma.planDay.deleteMany(),
    prisma.workoutPlan.deleteMany(),
    prisma.diaryEntry.deleteMany(),
    prisma.waterLog.deleteMany(),
    prisma.weightLog.deleteMany(),
    prisma.bodyMeasurement.deleteMany(),
    prisma.progressPhoto.deleteMany(),
    prisma.coachMessage.deleteMany(),
    prisma.coachConversation.deleteMany(),
    prisma.userAchievement.deleteMany(),
    prisma.dailyActivity.deleteMany(),
    prisma.reminder.deleteMany(),
    prisma.foodItem.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Exercises
  const exercises = await Promise.all(
    EXERCISES.map((e) =>
      prisma.exercise.create({
        data: {
          name: e.name,
          slug: slug(e.name),
          muscleGroup: e.muscleGroup,
          secondaryMuscles: e.secondary ?? null,
          equipment: e.equipment ?? "bodyweight",
          difficulty: e.difficulty ?? "beginner",
          category: e.category ?? "strength",
          description: e.description,
          instructions: e.instructions,
        },
      })
    )
  );
  const exByName = Object.fromEntries(exercises.map((e) => [e.name, e]));
  console.log(`   ✓ ${exercises.length} exercises`);

  // Foods
  await Promise.all(
    FOODS.map((f) =>
      prisma.foodItem.create({
        data: {
          name: f.name,
          brand: f.brand ?? null,
          calories: f.cal,
          protein: f.p,
          carbs: f.c,
          fat: f.f,
          category: f.cat,
          servingSize: f.serving ?? 100,
          servingUnit: f.unit ?? "g",
        },
      })
    )
  );
  console.log(`   ✓ ${FOODS.length} foods`);

  // Workout plan templates
  const plan = async (
    name: string,
    description: string,
    level: string,
    split: string,
    daysPerWeek: number,
    days: { name: string; focus: string; items: [string, number, string, number][] }[]
  ) => {
    const p = await prisma.workoutPlan.create({
      data: { name, slug: slug(name), description, level, split, daysPerWeek, isTemplate: true },
    });
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const pd = await prisma.planDay.create({
        data: { planId: p.id, dayIndex: i, name: d.name, focus: d.focus },
      });
      for (let j = 0; j < d.items.length; j++) {
        const [exName, sets, reps, rest] = d.items[j];
        const ex = exByName[exName];
        if (!ex) continue;
        await prisma.planExercise.create({
          data: { planDayId: pd.id, exerciseId: ex.id, order: j, sets, reps, restSec: rest },
        });
      }
    }
    return p;
  };

  await plan("Beginner Foundations", "A 3-day full-body split to learn the basics and build a base.", "beginner", "full_body", 3, [
    { name: "Full Body A", focus: "Push emphasis", items: [["Barbell Back Squat", 3, "8-10", 120], ["Barbell Bench Press", 3, "8-10", 120], ["Seated Cable Row", 3, "10-12", 90], ["Plank", 3, "45s", 60]] },
    { name: "Full Body B", focus: "Pull emphasis", items: [["Romanian Deadlift", 3, "8-10", 120], ["Lat Pulldown", 3, "10-12", 90], ["Overhead Press", 3, "8-10", 120], ["Dumbbell Hammer Curl", 3, "12-15", 60]] },
    { name: "Full Body C", focus: "Balanced", items: [["Leg Press", 3, "10-12", 120], ["Incline Dumbbell Press", 3, "10-12", 90], ["Pull-Up", 3, "AMRAP", 120], ["Cable Crunch", 3, "12-15", 60]] },
  ]);

  await plan("Push Pull Legs", "The classic 6-day PPL split for intermediate hypertrophy.", "intermediate", "ppl", 6, [
    { name: "Push Day", focus: "Chest · Shoulders · Triceps", items: [["Barbell Bench Press", 4, "6-8", 150], ["Overhead Press", 3, "8-10", 120], ["Incline Dumbbell Press", 3, "10-12", 90], ["Dumbbell Lateral Raise", 4, "12-15", 60], ["Triceps Rope Pushdown", 3, "12-15", 60]] },
    { name: "Pull Day", focus: "Back · Biceps", items: [["Deadlift", 3, "5", 180], ["Pull-Up", 4, "8-10", 120], ["Bent-Over Barbell Row", 3, "8-10", 120], ["Face Pull", 3, "15-20", 60], ["Barbell Biceps Curl", 3, "10-12", 60]] },
    { name: "Legs Day", focus: "Quads · Hams · Calves", items: [["Barbell Back Squat", 4, "6-8", 180], ["Romanian Deadlift", 3, "8-10", 120], ["Leg Press", 3, "12-15", 120], ["Walking Lunge", 3, "12", 90], ["Standing Calf Raise", 4, "15-20", 60]] },
  ]);

  await plan("Upper / Lower", "A 4-day upper/lower split balancing strength and size.", "intermediate", "upper_lower", 4, [
    { name: "Upper A", focus: "Strength", items: [["Barbell Bench Press", 4, "5-6", 150], ["Bent-Over Barbell Row", 4, "6-8", 120], ["Overhead Press", 3, "8-10", 120], ["Lat Pulldown", 3, "10-12", 90]] },
    { name: "Lower A", focus: "Strength", items: [["Barbell Back Squat", 4, "5-6", 180], ["Romanian Deadlift", 3, "8-10", 120], ["Leg Press", 3, "12-15", 120], ["Standing Calf Raise", 4, "15-20", 60]] },
    { name: "Upper B", focus: "Hypertrophy", items: [["Incline Dumbbell Press", 4, "10-12", 90], ["Seated Cable Row", 4, "10-12", 90], ["Dumbbell Lateral Raise", 4, "15", 60], ["Barbell Biceps Curl", 3, "12", 60]] },
    { name: "Lower B", focus: "Hypertrophy", items: [["Romanian Deadlift", 4, "10-12", 120], ["Walking Lunge", 3, "12", 90], ["Leg Press", 3, "15-20", 90], ["Hanging Leg Raise", 3, "12-15", 60]] },
  ]);

  await plan("Arnold Split", "High-volume 6-day classic — chest/back, shoulders/arms, legs.", "advanced", "arnold", 6, [
    { name: "Chest & Back", focus: "Superset focus", items: [["Barbell Bench Press", 4, "8-10", 120], ["Pull-Up", 4, "8-10", 120], ["Incline Dumbbell Press", 3, "10-12", 90], ["Bent-Over Barbell Row", 3, "10-12", 90], ["Cable Fly", 3, "15", 60]] },
    { name: "Shoulders & Arms", focus: "Delts & guns", items: [["Overhead Press", 4, "8-10", 120], ["Dumbbell Lateral Raise", 4, "15", 60], ["Barbell Biceps Curl", 4, "10-12", 60], ["Triceps Rope Pushdown", 4, "12-15", 60], ["Overhead Triceps Extension", 3, "12", 60]] },
    { name: "Legs", focus: "Quads & hams", items: [["Barbell Back Squat", 5, "8-10", 150], ["Romanian Deadlift", 4, "10-12", 120], ["Leg Press", 4, "15", 90], ["Standing Calf Raise", 5, "15-20", 45]] },
  ]);
  console.log("   ✓ 4 workout plan templates");

  // Achievements
  const ACH = [
    { key: "first_workout", name: "First Steps", description: "Complete your first workout", icon: "dumbbell", category: "workout", xp: 50, threshold: 1 },
    { key: "workouts_10", name: "Getting Serious", description: "Complete 10 workouts", icon: "flame", category: "workout", xp: 150, threshold: 10 },
    { key: "workouts_50", name: "Iron Addict", description: "Complete 50 workouts", icon: "trophy", category: "workout", xp: 500, threshold: 50 },
    { key: "streak_3", name: "Consistency", description: "Hit a 3-day streak", icon: "zap", category: "streak", xp: 75, threshold: 3 },
    { key: "streak_7", name: "One Week Strong", description: "Hit a 7-day streak", icon: "calendar-check", category: "streak", xp: 200, threshold: 7 },
    { key: "streak_30", name: "Unstoppable", description: "Hit a 30-day streak", icon: "crown", category: "streak", xp: 1000, threshold: 30 },
    { key: "first_meal", name: "Tracker", description: "Log your first meal", icon: "utensils", category: "nutrition", xp: 50, threshold: 1 },
    { key: "protein_goal", name: "Protein Pro", description: "Hit your protein goal", icon: "egg", category: "nutrition", xp: 100, threshold: 1 },
    { key: "hydrated", name: "Hydrated", description: "Meet your water goal in a day", icon: "droplet", category: "nutrition", xp: 75, threshold: 1 },
    { key: "first_weigh", name: "On The Scale", description: "Log your weight for the first time", icon: "scale", category: "body", xp: 50, threshold: 1 },
    { key: "lost_5kg", name: "5kg Down", description: "Lose 5kg from your starting weight", icon: "trending-down", category: "body", xp: 500, threshold: 5 },
    { key: "gained_5kg", name: "Mass Monster", description: "Gain 5kg of bodyweight", icon: "trending-up", category: "body", xp: 500, threshold: 5 },
    { key: "level_5", name: "Rising Star", description: "Reach level 5", icon: "star", category: "milestone", xp: 250, threshold: 5 },
    { key: "level_10", name: "Elite", description: "Reach level 10", icon: "medal", category: "milestone", xp: 750, threshold: 10 },
  ];
  const achievements = await Promise.all(
    ACH.map((a) => prisma.achievement.create({ data: a }))
  );
  console.log(`   ✓ ${achievements.length} achievements`);

  // ── Demo user with rich sample data ────────────────────
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const startWeight = 82;
  const currentWeight = 78.4;
  const user = await prisma.user.create({
    data: {
      email: "demo@aura.fit",
      name: "Alex Carter",
      passwordHash,
      profile: {
        create: {
          age: 28,
          gender: "male",
          heightCm: 178,
          weightKg: currentWeight,
          targetWeightKg: 74,
          activityLevel: "moderate",
          goal: "weight_loss",
          experience: "intermediate",
          bmi: 24.7,
          bmr: 1790,
          tdee: 2774,
          targetCalories: 2274,
          proteinG: 172,
          fatG: 63,
          carbsG: 256,
          waterGoalMl: 3000,
          xp: 1840,
          level: 6,
          currentStreak: 5,
          longestStreak: 12,
          lastActiveDate: day(0),
          onboardingComplete: true,
        },
      },
      reminders: {
        create: [
          { type: "workout", label: "Time to train 💪", time: "18:00" },
          { type: "water", label: "Hydrate!", time: "11:00" },
          { type: "meal", label: "Log your lunch", time: "13:00" },
          { type: "weight", label: "Morning weigh-in", time: "07:30" },
        ],
      },
    },
  });

  // Weight history — 30 days trending down with noise
  for (let i = 30; i >= 0; i--) {
    const t = (30 - i) / 30;
    const w = +(startWeight - (startWeight - currentWeight) * t + rand(-0.4, 0.4)).toFixed(1);
    await prisma.weightLog.create({
      data: { userId: user.id, date: day(-i), weightKg: w },
    });
  }

  // Water logs — last 7 days
  for (let i = 6; i >= 0; i--) {
    const total = i === 0 ? 1800 : Math.round(rand(2200, 3200));
    let logged = 0;
    while (logged < total) {
      const amt = 250;
      await prisma.waterLog.create({ data: { userId: user.id, date: day(-i), amountMl: amt } });
      logged += amt;
    }
  }

  // Diary — today's meals
  const today = day(0);
  const meals: [string, string, number][] = [
    ["breakfast", "Oats (dry)", 0.8],
    ["breakfast", "Whey Protein (1 scoop)", 1],
    ["breakfast", "Banana", 1],
    ["lunch", "Chicken Breast (grilled)", 2],
    ["lunch", "White Rice (cooked)", 2],
    ["lunch", "Broccoli", 1.5],
    ["snack", "Greek Yogurt (plain, 0%)", 1.5],
    ["snack", "Almonds", 0.3],
  ];
  const foods = await prisma.foodItem.findMany();
  const foodMap = Object.fromEntries(foods.map((f) => [f.name, f]));
  for (const [mealType, foodName, servings] of meals) {
    const f = foodMap[foodName];
    if (!f) continue;
    await prisma.diaryEntry.create({
      data: {
        userId: user.id,
        date: today,
        mealType,
        foodItemId: f.id,
        servings,
        calories: Math.round(f.calories * servings),
        protein: +(f.protein * servings).toFixed(1),
        carbs: +(f.carbs * servings).toFixed(1),
        fat: +(f.fat * servings).toFixed(1),
      },
    });
  }

  // A couple of completed workout sessions
  const ppl = await prisma.workoutPlan.findFirst({ where: { slug: "push-pull-legs" }, include: { days: { include: { exercises: { include: { exercise: true } } } } } });
  if (ppl) {
    for (let s = 0; s < 2; s++) {
      const d = ppl.days[s % ppl.days.length];
      const session = await prisma.workoutSession.create({
        data: {
          userId: user.id,
          planId: ppl.id,
          planDayId: d.id,
          name: d.name,
          startedAt: day(-(s * 2 + 1)),
          completedAt: day(-(s * 2 + 1)),
          durationSec: 3600 + s * 600,
        },
      });
      let volume = 0;
      for (const pe of d.exercises) {
        const se = await prisma.sessionExercise.create({
          data: { sessionId: session.id, exerciseId: pe.exerciseId, order: pe.order },
        });
        for (let setN = 1; setN <= pe.sets; setN++) {
          const reps = 8 + Math.round(rand(0, 4));
          const weight = pe.exercise.equipment === "bodyweight" ? 0 : Math.round(rand(20, 90));
          volume += reps * weight;
          await prisma.setLog.create({
            data: { sessionExerciseId: se.id, setNumber: setN, reps, weightKg: weight, completed: true },
          });
        }
      }
      await prisma.workoutSession.update({ where: { id: session.id }, data: { totalVolume: volume } });
    }
  }

  // Unlock some achievements
  const unlock = ["first_workout", "streak_3", "first_meal", "first_weigh", "hydrated", "level_5"];
  for (const key of unlock) {
    const a = achievements.find((x) => x.key === key);
    if (a) {
      await prisma.userAchievement.create({
        data: { userId: user.id, achievementId: a.id, progress: a.threshold, unlockedAt: day(-rand(1, 10)) },
      });
    }
  }

  // Daily activity log for streak
  for (let i = 4; i >= 0; i--) {
    await prisma.dailyActivity.create({
      data: {
        userId: user.id,
        date: day(-i),
        workoutDone: i % 2 === 0,
        nutritionLogged: true,
        waterGoalMet: i !== 0,
        weightLogged: true,
        xpEarned: Math.round(rand(50, 200)),
      },
    });
  }

  // A starter coach conversation
  const convo = await prisma.coachConversation.create({
    data: { userId: user.id, title: "Welcome to Aura" },
  });
  await prisma.coachMessage.createMany({
    data: [
      { conversationId: convo.id, role: "assistant", content: "Hey Alex! 👋 I'm your AI coach. I've reviewed your profile — you're down 3.6kg toward your 74kg goal and on a 5-day streak. Want me to suggest tweaks to keep the momentum going?" },
    ],
  });

  console.log("\n✅  Seed complete!");
  console.log("   Demo login →  demo@aura.fit  /  demo1234\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
