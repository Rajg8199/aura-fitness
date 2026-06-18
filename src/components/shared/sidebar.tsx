"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { levelFromXp } from "@/lib/fitness";
import { Progress } from "@/components/ui/progress";

export function Sidebar({ xp }: { xp: number }) {
  const pathname = usePathname();
  const level = levelFromXp(xp);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/50 bg-card/40 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo href="/dashboard" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-brand-gradient-soft text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", active && "text-primary")} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Level widget */}
      <div className="m-3 rounded-2xl border bg-card/60 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-display font-semibold">Level {level.level}</span>
          <span className="text-xs text-muted-foreground">{level.current}/{level.needed} XP</span>
        </div>
        <Progress value={level.pct} indicatorClassName="bg-brand-gradient" className="mt-2.5 h-2" />
        <p className="mt-2 text-xs text-muted-foreground">Keep logging to level up 🚀</p>
      </div>
    </aside>
  );
}
