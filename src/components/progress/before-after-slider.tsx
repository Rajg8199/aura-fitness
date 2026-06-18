"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  const move = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, p)));
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl border"
      onMouseMove={(e) => e.buttons === 1 && move(e.clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      <Image src={after} alt={afterLabel} fill unoptimized className="object-cover" />
      <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{afterLabel}</div>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <Image src={before} alt={beforeLabel} fill unoptimized className="object-cover" style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }} />
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{beforeLabel}</div>
      </div>
      {/* Handle */}
      <div className="absolute inset-y-0 flex w-0.5 items-center justify-center bg-white" style={{ left: `${pos}%` }}>
        <div className="flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-black"><path fill="currentColor" d="M8 7l-5 5l5 5zm8 0v10l5-5z" /></svg>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-x-0 bottom-0 z-10 w-full cursor-ew-resize opacity-0"
        aria-label="Compare slider"
      />
    </div>
  );
}
