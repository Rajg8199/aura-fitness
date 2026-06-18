import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showText = true,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
}) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
          {/* Stylized 'A' aura mark */}
          <path
            d="M12 3L4 20h3.2l1.3-3h7l1.3 3H21L12 3zm-2.3 11L12 8.4 14.3 14H9.7z"
            fill="currentColor"
          />
        </svg>
      </span>
      {showText && (
        <span className="font-display text-lg font-bold tracking-tight">Aura</span>
      )}
    </span>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
