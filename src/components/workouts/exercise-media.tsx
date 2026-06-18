"use client";

import { useState } from "react";
import Image from "next/image";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const MUSCLE_GRADIENTS: Record<string, string> = {
  chest: "from-rose-500/30 to-orange-500/20",
  back: "from-cyan-500/30 to-blue-500/20",
  legs: "from-violet-500/30 to-fuchsia-500/20",
  shoulders: "from-amber-500/30 to-yellow-500/20",
  arms: "from-emerald-500/30 to-teal-500/20",
  core: "from-pink-500/30 to-rose-500/20",
  full_body: "from-indigo-500/30 to-purple-500/20",
  cardio: "from-red-500/30 to-orange-500/20",
};

export function ExerciseMedia({
  src,
  alt,
  muscleGroup,
  className,
  rounded = "rounded-xl",
}: {
  src?: string | null;
  alt: string;
  muscleGroup: string;
  className?: string;
  rounded?: string;
}) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <div className={cn("relative overflow-hidden bg-secondary", rounded, className)}>
      {showImage ? (
        <Image src={src} alt={alt} fill unoptimized className="object-cover" onError={() => setErrored(true)} sizes="(max-width:768px) 100vw, 33vw" />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", MUSCLE_GRADIENTS[muscleGroup] ?? MUSCLE_GRADIENTS.full_body)}>
          <Dumbbell className="h-1/3 w-1/3 max-h-12 max-w-12 text-foreground/40" />
        </div>
      )}
    </div>
  );
}
