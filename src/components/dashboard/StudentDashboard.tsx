"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { PlayCircle, Trophy, CalendarCheck, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface DashboardData {
  activePlan: {
    id: string;
    name: string;
    versions: Array<{ days: Array<{ id: string; name: string; exercises: unknown[] }> }>;
  } | null;
  lastSession: { completedAt: string | null; day: { name: string } | null } | null;
  sessionsThisWeek: number;
  recentPRs: Array<{ id: string; exerciseName: string; weightKg: number; reps: number }>;
  unreadNotifications: number;
}

export function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [startingDayId, setStartingDayId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetch("/api/dashboard/student")
      .then((r) => r.json())
      .then(setData);
  }, []);

  async function startDay(dayId: string) {
    setStartingDayId(dayId);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error();
      router.push(`/train/${d.session.id}`);
    } catch {
      toast.error("Errore durante l'avvio dell'allenamento");
      setStartingDayId(null);
    }
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const days = data.activePlan?.versions[0]?.days ?? [];
  const nextDay = days[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Ciao! 👋</h1>
        <p className="text-sm text-muted-foreground">Ecco il tuo riepilogo di oggi.</p>
      </div>

      {data.activePlan && nextDay ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">Prossimo allenamento</p>
            <p className="text-xl font-bold">{nextDay.name}</p>
            <p className="text-sm text-muted-foreground">{data.activePlan.name}</p>
            <Button size="lg" loading={startingDayId === nextDay.id} onClick={() => startDay(nextDay.id)}>
              <PlayCircle size={18} /> Inizia allenamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="Nessuna scheda attiva" description="Il tuo Personal Trainer non ti ha ancora assegnato una scheda." />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 text-center">
            <CalendarCheck size={20} className="mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{data.sessionsThisWeek}</p>
            <p className="text-xs text-muted-foreground">Allenamenti questa settimana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <Flame size={20} className="mx-auto mb-1 text-accent" />
            <p className="text-xl font-bold">{data.recentPRs.length}</p>
            <p className="text-xs text-muted-foreground">Record recenti</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-5 text-center">
            <p className="text-xl font-bold">
              {data.lastSession?.completedAt
                ? formatDistanceToNow(new Date(data.lastSession.completedAt), { addSuffix: true, locale: it })
                : "Mai"}
            </p>
            <p className="text-xs text-muted-foreground">Ultimo allenamento</p>
          </CardContent>
        </Card>
      </div>

      {data.recentPRs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={16} className="text-accent" /> I tuoi ultimi record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentPRs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between text-sm">
                <span>{pr.exerciseName}</span>
                <Badge variant="accent">
                  {pr.weightKg}kg × {pr.reps}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.activePlan && (
        <Link href={`/my-plan/${data.activePlan.id}`} className="block text-sm text-primary hover:underline">
          Visualizza la scheda completa →
        </Link>
      )}
    </div>
  );
}
