import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDashboardStats } from "@/lib/dashboard";

const GYM_BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop";

const quickActions = [
  { label: "Manage Members", href: "/members" },
  { label: "Log Check-in", href: "/check-in" },
  { label: "View Billing", href: "/billing" },
] as const;

const cardStyles = cn(
  "group rounded-3xl border border-white/10 bg-white/5 py-0 shadow-lg shadow-black/20 ring-0",
  "backdrop-blur-xl transition-all duration-300 ease-out",
  "hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/10"
);

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const metrics = [
    {
      title: "Total Members",
      value: stats.totalMembers.toString(),
      description: "All registered members",
      icon: Users,
      href: "/members",
      trend: `+${stats.newMembersThisMonth} this month`,
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions.toString(),
      description: "Currently valid plans",
      icon: CalendarDays,
      href: "/subscriptions",
      trend: stats.totalMembers > 0
        ? `${Math.round((stats.activeSubscriptions / stats.totalMembers) * 100)}% retention`
        : "0% retention",
    },
    {
      title: "Today's Check-ins",
      value: stats.todayCheckIns.toString(),
      description: "Entries logged today",
      icon: ClipboardCheck,
      href: "/check-in",
      trend: "Live tracking",
    },
  ] as const;

  return (
    <div
      className="relative -m-6 min-h-[calc(100vh)] md:-m-8"
      style={{
        backgroundImage: `url("${GYM_BACKGROUND_IMAGE}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-zinc-950/85 to-emerald-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_55%)]" />

      <div className="relative z-10 space-y-12 p-6 md:p-10 lg:p-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            Live Overview
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Welcome back, Manager
            </h1>
            <p className="max-w-xl text-base text-zinc-300 md:text-lg">
              Your gym is active and running. Here is today&apos;s performance at
              a glance.
            </p>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map(({ title, value, description, icon: Icon, href, trend }) => (
            <Link key={title} href={href} className="block">
              <Card className={cardStyles}>
                <CardHeader className="gap-3 px-7 pt-7 pb-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-medium text-zinc-300">
                        {title}
                      </CardTitle>
                      <CardDescription className="text-zinc-500">
                        {description}
                      </CardDescription>
                    </div>
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/20">
                      <Icon className="size-5" strokeWidth={2.25} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-7 pt-6 pb-7">
                  <p className="text-5xl font-bold tracking-tight text-white">
                    {value}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-400/90">
                      {trend}
                    </span>
                    <ArrowRight className="size-4 text-zinc-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            {quickActions.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5",
                  "text-sm font-medium text-zinc-200 backdrop-blur-md transition-all duration-300",
                  "hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                )}
              >
                {label}
                <ArrowRight className="size-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
