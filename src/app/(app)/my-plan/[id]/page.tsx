"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlayCircle, Video, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface PlanExercise {
  id: string;
  customName: string;
  muscleGroup: string | null;
  sets: number | null;
  reps: string | null;
  loadKg: number | null;
  rpe: number | null;
  restSeconds: number | null;
  videoUrl: string | null;
  externalLink: string | null;
  technicalNotes: string | null;
}

interface PlanDay {
  id: string;
  name: string;
  notes: string | null;
  exercises: PlanExercise[];
}

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  notes: string | null;
  currentVersionNumber: number;
  versions: Array<{ days: PlanDay[] }>;
}

export default function MyPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [error, setError] = useState(false);
  const [startingDayId, setStartingDayId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/plans/${params.id}`)
      .then(async (r) => {
        if (!r.ok) return setError(true);
        const d = await r.json();
        setPlan(d.plan);
      })
      .catch(() => setError(true));
  }, [params.id]);

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

  if (error) return <EmptyState title="Scheda non trovata" description="Non hai accesso a questa scheda." />;
  if (!plan) return <Skeleton className="h-96" />;

  const days = plan.versions[0]?.days ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{plan.name}</h1>
        <p className="text-sm text-muted-foreground">{plan.goal}</p>
        {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
        <Badge variant="outline" className="mt-2">
          v{plan.currentVersionNumber}
        </Badge>
      </div>

      {days.map((day) => (
        <Card key={day.id}>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{day.name}</p>
              <Button size="sm" loading={startingDayId === day.id} onClick={() => startDay(day.id)}>
                <PlayCircle size={15} /> Inizia
              </Button>
            </div>
            {day.notes && <p className="text-sm text-muted-foreground">{day.notes}</p>}
            <div className="space-y-2">
              {day.exercises.map((ex) => (
                <div key={ex.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{ex.customName}</p>
                    {ex.muscleGroup && <Badge variant="outline">{ex.muscleGroup}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ex.sets ?? "-"}×{ex.reps ?? "-"}
                    {ex.loadKg ? ` · ${ex.loadKg}kg` : ""}
                    {ex.rpe ? ` · RPE ${ex.rpe}` : ""}
                    {ex.restSeconds ? ` · Recupero ${ex.restSeconds}s` : ""}
                  </p>
                  {ex.technicalNotes && (
                    <p className="mt-1 text-xs text-muted-foreground">{ex.technicalNotes}</p>
                  )}
                  <div className="mt-1.5 flex gap-3">
                    {ex.videoUrl && (
                      <a
                        href={ex.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Video size={12} /> Video
                      </a>
                    )}
                    {ex.externalLink && (
                      <a
                        href={ex.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Link2 size={12} /> Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
