import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/subscriptions", label: "Subscriptions", icon: CalendarDays },
  { href: "/check-in", label: "Check-in", icon: ClipboardCheck },
  { href: "/billing", label: "Billing", icon: Receipt },
];
