import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionPlayer } from "@/components/workouts/session-player";

export const metadata = { title: "Workout session" };

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const workout = await prisma.workoutSession.findFirst({
    where: { id, userId },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!workout) notFound();
  if (workout.completedAt) redirect("/workouts");

  const allExercises = await prisma.exercise.findMany({ orderBy: { name: "asc" } });

  return <SessionPlayer workout={workout} library={allExercises} />;
}
