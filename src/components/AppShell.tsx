"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Image as ImageIcon,
  User as UserIcon,
  TrendingUp,
  Dumbbell,
  PlayCircle,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useCurrentUser } from "@/components/user-context";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/theme-toggle";

const trainerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Allievi", icon: Users },
  { href: "/plans", label: "Schede", icon: ClipboardList },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/profile", label: "Profilo", icon: UserIcon },
  { href: "/support", label: "Assistenza", icon: LifeBuoy },
];

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-plan", label: "Scheda", icon: ClipboardList },
  { href: "/train", label: "Allenati", icon: PlayCircle },
  { href: "/progress", label: "Progressi", icon: TrendingUp },
  { href: "/media", label: "Media", icon: ImageIcon },
  { href: "/profile", label: "Profilo", icon: UserIcon },
  { href: "/support", label: "Assistenza", icon: LifeBuoy },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const nav = user.role === "TRAINER" ? trainerNav : studentNav;
  const bottomNav = nav.slice(0, 5);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5 md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell size={18} />
          </div>
          <span className="text-sm font-bold leading-tight">
            Fitness Coach
            <br />
            Platform
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-3">
          <Badge role={user.role} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell size={16} />
            </div>
            <span className="text-sm font-bold">Fitness Coach</span>
          </Link>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur md:hidden">
          {bottomNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function Badge({ role }: { role: "TRAINER" | "STUDENT" | "ADMIN" }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", role === "TRAINER" ? "bg-primary" : "bg-accent")} />
      {role === "TRAINER" ? "Personal Trainer" : role === "STUDENT" ? "Allievo" : "Admin"}
    </div>
  );
}
