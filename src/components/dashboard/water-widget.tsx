"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Droplets, Plus, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addWater, undoLastWater } from "@/server/actions/tracking";
import { cn } from "@/lib/utils";

export function WaterWidget({ initialMl, goalMl }: { initialMl: number; goalMl: number }) {
  const [ml, setMl] = useState(initialMl);
  const [, startTransition] = useTransition();
  const pct = Math.min(100, (ml / goalMl) * 100);

  const add = (amount: number) => {
    setMl((v) => Math.max(0, v + amount));
    startTransition(async () => {
      if (amount > 0) await addWater(amount);
      else await undoLastWater();
    });
  };

  return (
    <Card className="relative overflow-hidden p-5">
      {/* animated water fill */}
      <motion.div
        className="absolute inset-x-0 bottom-0 -z-0 bg-gradient-to-t from-cyan-500/25 to-cyan-400/5"
        initial={false}
        animate={{ height: `${pct}%` }}
        transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.6 }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/12">
              <Droplets className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Water</div>
              <div className="font-display text-xl font-bold">
                {(ml / 1000).toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground"> / {(goalMl / 1000).toFixed(1)}L</span>
              </div>
            </div>
          </div>
          <span className={cn("text-2xl font-bold", pct >= 100 ? "text-[hsl(var(--success))]" : "text-cyan-500")}>
            {Math.round(pct)}%
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => add(-250)} aria-label="Remove water">
            <Minus className="h-4 w-4" />
          </Button>
          {[250, 500].map((a) => (
            <Button key={a} size="sm" variant="secondary" className="flex-1" onClick={() => add(a)}>
              <Plus className="h-3.5 w-3.5" /> {a}ml
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
