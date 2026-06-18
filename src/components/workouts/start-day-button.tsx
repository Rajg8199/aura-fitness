"use client";

import { useTransition } from "react";
import { Loader2, Play } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { startSessionFromPlanDay } from "@/server/actions/workout";

export function StartDayButton({ planDayId, ...props }: { planDayId: string } & ButtonProps) {
  const [pending, start] = useTransition();
  return (
    <Button variant="gradient" onClick={() => start(() => startSessionFromPlanDay(planDayId))} disabled={pending} {...props}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      Start
    </Button>
  );
}
