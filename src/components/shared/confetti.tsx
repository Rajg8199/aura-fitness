"use client";

import { useCallback } from "react";
import confetti from "canvas-confetti";

/** Fire a premium burst of confetti. Returns a callable. */
export function useConfetti() {
  return useCallback((origin?: { x?: number; y?: number }) => {
    const colors = ["#8b5cf6", "#d946ef", "#06b6d4", "#22c55e", "#f59e0b"];
    const defaults = {
      origin: { x: origin?.x ?? 0.5, y: origin?.y ?? 0.6 },
      colors,
      disableForReducedMotion: true,
    };
    confetti({ ...defaults, particleCount: 80, spread: 70, startVelocity: 45 });
    setTimeout(() => confetti({ ...defaults, particleCount: 50, spread: 100, decay: 0.92, scalar: 1.2 }), 150);
    setTimeout(() => confetti({ ...defaults, particleCount: 40, spread: 120, startVelocity: 25, scalar: 0.8 }), 300);
  }, []);
}

/** Big celebratory cannon from both sides — for workout completion. */
export function fireCelebration() {
  const colors = ["#8b5cf6", "#d946ef", "#06b6d4", "#22c55e", "#f59e0b"];
  const end = Date.now() + 1200;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors, disableForReducedMotion: true });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
