"use client";

import { motion } from "framer-motion";

interface Ring {
  value: number; // 0-100
  color: string;
}

/** Apple-Fitness style concentric activity rings. */
export function ActivityRings({
  rings,
  size = 160,
  strokeWidth = 14,
  gap = 4,
}: {
  rings: Ring[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
}) {
  return (
    <svg width={size} height={size} className="-rotate-90">
      {rings.map((ring, i) => {
        const radius = (size - strokeWidth) / 2 - i * (strokeWidth + gap);
        if (radius <= 0) return null;
        const circumference = 2 * Math.PI * radius;
        const clamped = Math.min(100, Math.max(0, ring.value));
        const offset = circumference - (clamped / 100) * circumference;
        return (
          <g key={i}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              stroke={ring.color}
              opacity={0.15}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              stroke={ring.color}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, delay: i * 0.15, ease: [0.32, 0.72, 0, 1] }}
            />
          </g>
        );
      })}
    </svg>
  );
}
