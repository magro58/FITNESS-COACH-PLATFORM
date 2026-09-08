"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, RotateCcw, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface ActivePlan {
  id: string;
  name: string;
  versions: Array<{ days: Array<{ id: string; name: string; exercises: Array<{ id: string }> }> }>;
}

interface InProgressSession {
  id: string;
  day: { name: string } | null;
  startedAt: string;
}

export default function TrainHomePage() {
  const router = useRouter();
  const toast = useToast();
  const [plans, setPlans] = useState<ActivePlan[] | null>(null);
  const [inProgress, setInProgress] = useState<InProgressSession[]>([]);
  const [startingDayId, setStartingDayId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/my-plans")
      .then((r) => r.json())
      .then(async (d) => {
        const active = (d.plans ?? []).filter((p: { status: string }) => p.status === "ACTIVE");
        const detailed = await Promise.all(
          active.map((p: { id: string }) => fetch(`/api/plans/${p.id}`).then((r) => r.json()))
        );
        setPlans(detailed.map((x) => x.plan));
      });
    fetch("/api/sessions?status=IN_PROGRESS")
      .then((r) => r.json())
      .then((d) => setInProgress(d.sessions ?? []));
  }, []);

  async function startDay(dayId: string) {
    setStartingDayId(dayId);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      router.push(`/train/${data.session.id}`);
    } catch {
      toast.error("Errore durante l'avvio dell'allenamento");
      setStartingDayId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Allenati</h1>
        <p className="text-sm text-muted-foreground">Scegli la giornata da svolgere.</p>
      </div>

      {inProgress.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-accent">Allenamento in corso</p>
          {inProgress.map((s) => (
            <Card key={s.id} className="border-accent/40 bg-accent/5">
              <CardContent className="flex items-center justify-between pt-5">
                <div>
                  <p className="font-medium">{s.day?.name ?? "Allenamento"}</p>
                  <p className="text-xs text-muted-foreground">Iniziato in precedenza, non ancora completato</p>
                </div>
                <Button size="sm" onClick={() => router.push(`/train/${s.id}`)}>
                  <RotateCcw size={14} /> Riprendi
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {plans === null && <Skeleton className="h-48" />}

      {plans?.length === 0 && (
        <EmptyState
          icon={<Dumbbell size={32} />}
          title="Nessuna scheda attiva"
          description="Il tuo Personal Trainer non ti ha ancora assegnato una scheda attiva."
        />
      )}

      {plans?.map((plan) => (
        <div key={plan.id} className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">{plan.name}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plan.versions[0]?.days.map((day) => (
              <Card key={day.id}>
                <CardContent className="flex items-center justify-between pt-5">
                  <div>
                    <p className="font-medium">{day.name}</p>
                    <Badge variant="outline">{day.exercises.length} esercizi</Badge>
                  </div>
                  <Button size="sm" loading={startingDayId === day.id} onClick={() => startDay(day.id)}>
                    <PlayCircle size={15} /> Inizia
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
