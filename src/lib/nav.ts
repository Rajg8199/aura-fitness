import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  TrendingUp,
  Bot,
  BarChart3,
  Trophy,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** show in the mobile bottom bar */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobile: true },
  { label: "Workouts", href: "/workouts", icon: Dumbbell, mobile: true },
  { label: "Nutrition", href: "/nutrition", icon: Apple, mobile: true },
  { label: "Progress", href: "/progress", icon: TrendingUp, mobile: true },
  { label: "AI Coach", href: "/coach", icon: Bot, mobile: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Settings", href: "/settings", icon: Settings },
];
