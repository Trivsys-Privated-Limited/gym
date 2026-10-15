import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Salad,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "My fitness",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/tasks", label: "Tasks & habits", icon: ListChecks },
      { href: "/dashboard/workouts", label: "Workouts", icon: CalendarDays },
      { href: "/dashboard/exercises", label: "Exercise library", icon: BookOpen },
      { href: "/dashboard/nutrition", label: "Nutrition", icon: Salad },
      { href: "/dashboard/progress", label: "Progress", icon: BarChart3 },
    ],
  },
  {
    label: "Gym (demo)",
    items: [{ href: "/dashboard/gym", label: "Gym management", icon: Building2 }],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: UserRound },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const MOBILE_TABS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListChecks },
  { href: "/dashboard/workouts", label: "Workouts", icon: CalendarDays },
  { href: "/dashboard/nutrition", label: "Food", icon: Salad },
];

export function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}
