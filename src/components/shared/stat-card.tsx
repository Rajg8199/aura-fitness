import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "text-primary",
  iconBg = "bg-brand-gradient-soft",
  trend,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  iconBg?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  return (
    <Card className={cn("card-hover overflow-hidden p-5", className)}>
      <div className="flex items-start justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", accent)} />
        </div>
        {trend && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              trend.positive
                ? "bg-[hsl(var(--success))]/12 text-[hsl(var(--success))]"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground/80">{sub}</div>}
      </div>
    </Card>
  );
}
