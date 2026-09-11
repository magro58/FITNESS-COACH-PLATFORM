"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Dumbbell, GraduationCap, ShieldCheck, LifeBuoy, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface Stats {
  trainers: number;
  students: number;
  admins: number;
  disabledUsers: number;
  openTickets: number;
  inProgressTickets: number;
  totalTickets: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const cards = stats
    ? [
        { label: "Personal Trainer", value: stats.trainers, icon: Dumbbell, href: "/admin/users?role=TRAINER" },
        { label: "Allievi", value: stats.students, icon: GraduationCap, href: "/admin/users?role=STUDENT" },
        { label: "Admin", value: stats.admins, icon: ShieldCheck, href: "/admin/users?role=ADMIN" },
        { label: "Account disabilitati", value: stats.disabledUsers, icon: UserX, href: "/admin/users" },
        { label: "Ticket aperti", value: stats.openTickets, icon: LifeBuoy, href: "/admin/tickets?status=OPEN" },
        {
          label: "Ticket in lavorazione",
          value: stats.inProgressTickets,
          icon: LifeBuoy,
          href: "/admin/tickets?status=IN_PROGRESS",
        },
      ]
    : [];

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Pannello di amministrazione</h1>
        <p className="text-sm text-muted-foreground">
          Panoramica sulle utenze registrate e sulle richieste di assistenza.
        </p>
      </div>

      {stats === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.label} href={c.href}>
              <Card className="h-full transition hover:border-primary/40 hover:bg-muted/40">
                <CardContent className="flex flex-col gap-2 py-4">
                  <c.icon size={18} className="text-primary" />
                  <p className="text-2xl font-bold tabular-nums">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium">Gestione utenze</p>
              <p className="text-xs text-muted-foreground">
                Cerca, filtra, disabilita o elimina gli account registrati
              </p>
            </div>
          </div>
          <Link href="/admin/users" className="text-sm font-medium text-primary hover:underline">
            Vai alla gestione utenti →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
