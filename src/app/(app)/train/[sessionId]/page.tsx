"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Circle, Video, Link2, StickyNote, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { RestTimer } from "@/components/RestTimer";
import { FatigueSurveyDialog } from "@/components/FatigueSurveyDialog";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

interface SetLog {
  id: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
  toFailure: boolean;
}

interface ExerciseLog {
  id: string;
  exerciseName: string;
  muscleGroup: string | null;
  orderIndex: number;
  planExercise: {
    sets: number | null;
    reps: string | null;
    loadKg: number | null;
    rpe: number | null;
    rir: number | null;
    restSeconds: number | null;
    videoUrl: string | null;
    externalLink: string | null;
    technicalNotes: string | null;
  } | null;
  setLogs: SetLog[];
}

interface SessionData {
  id: string;
  status: string;
  startedAt: string;
  day: { name: string } | null;
  plan: { name: string } | null;
  exerciseLogs: ExerciseLog[];
}

export default function TrainingModePage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const toast = useToast();
  const [session, setSession] = useState<SessionData | null>(null);
  const [lastByExercise, setLastByExercise] = useState<Record<string, { weightKg: number | null; reps: number | null }[]>>({});
  const [restTimer, setRestTimer] = useState<{ key: number; seconds: number } | null>(null);
  const [completing, setCompleting] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/sessions/${params.sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        setSession(d.session);
        setLastByExercise(d.lastByExercise ?? {});
      });
  }, [params.sessionId]);

  useEffect(load, [load]);

  const { totalSets, completedSets } = useMemo(() => {
    if (!session) return { totalSets: 0, completedSets: 0 };
    let total = 0;
    let done = 0;
    for (const log of session.exerciseLogs) {
      total += log.setLogs.length;
      done += log.setLogs.filter((s) => s.completed).length;
    }
    return { totalSets: total, completedSets: done };
  }, [session]);

  async function updateSet(setId: string, patch: Partial<SetLog>) {
    if (!session) return;
    setSession((prev) =>
      prev
        ? {
            ...prev,
            exerciseLogs: prev.exerciseLogs.map((log) => ({
              ...log,
              setLogs: log.setLogs.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
            })),
          }
        : prev
    );
    await fetch(`/api/sessions/${session.id}/sets/${setId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.newPR) toast.success(`Nuovo record personale su questo esercizio!`);
      });
  }

  function toggleComplete(log: ExerciseLog, set: SetLog) {
    const next = !set.completed;
    updateSet(set.id, { completed: next });
    if (next && log.planExercise?.restSeconds) {
      setRestTimer({ key: Date.now(), seconds: log.planExercise.restSeconds });
    }
  }

  async function completeWorkout(fatigueSurvey?: Record<string, number>) {
    if (!session) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fatigueSurvey: fatigueSurvey ?? null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Allenamento completato! Ottimo lavoro.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Errore durante il completamento");
    } finally {
      setCompleting(false);
      setSurveyOpen(false);
    }
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const progressPct = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-28 animate-fade-in">
      <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{session.day?.name ?? session.plan?.name}</p>
            <p className="text-xs text-muted-foreground">
              {completedSets}/{totalSets} serie completate
            </p>
          </div>
          <Badge variant={session.status === "COMPLETED" ? "primary" : "accent"}>
            {session.status === "COMPLETED" ? "Completato" : "In corso"}
          </Badge>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {session.exerciseLogs.map((log) => {
        const target = log.planExercise;
        const lastData = lastByExercise[log.exerciseName];
        return (
          <Card key={log.id}>
            <CardContent className="space-y-3 pt-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{log.exerciseName}</p>
                  {log.muscleGroup && <Badge variant="outline">{log.muscleGroup}</Badge>}
                </div>
                {target && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Target: {target.sets ?? "-"}×{target.reps ?? "-"}
                    {target.loadKg ? ` @ ${target.loadKg}kg` : ""}
                    {target.rpe ? ` · RPE ${target.rpe}` : ""}
                    {target.restSeconds ? ` · Recupero ${target.restSeconds}s` : ""}
                  </p>
                )}
                {lastData && lastData.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Ultima volta: {lastData.map((s) => `${s.weightKg ?? "-"}kg×${s.reps ?? "-"}`).join(", ")}
                  </p>
                )}
                {target?.technicalNotes && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                    <StickyNote size={12} className="mt-0.5 shrink-0" /> {target.technicalNotes}
                  </p>
                )}
                <div className="mt-1.5 flex gap-3">
                  {target?.videoUrl && (
                    <a
                      href={target.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Video size={12} /> Video dimostrativo
                    </a>
                  )}
                  {target?.externalLink && (
                    <a
                      href={target.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Link2 size={12} /> Link
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-2 px-1 text-[11px] font-medium uppercase text-muted-foreground">
                  <span className="w-6">#</span>
                  <span>Peso (kg)</span>
                  <span>Reps</span>
                  <span>RPE</span>
                  <span className="w-7" />
                </div>
                {log.setLogs.map((set) => (
                  <div
                    key={set.id}
                    className={cn(
                      "grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-2 rounded-md p-1 transition",
                      set.completed && "bg-primary/5"
                    )}
                  >
                    <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                      {set.setNumber}
                    </span>
                    <Input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      defaultValue={set.weightKg ?? ""}
                      onBlur={(e) =>
                        updateSet(set.id, { weightKg: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className="h-9"
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      defaultValue={set.reps ?? ""}
                      onBlur={(e) =>
                        updateSet(set.id, { reps: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className="h-9"
                    />
                    <Input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      defaultValue={set.rpe ?? ""}
                      onBlur={(e) =>
                        updateSet(set.id, { rpe: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className="h-9"
                    />
                    <button
                      type="button"
                      onClick={() => toggleComplete(log, set)}
                      aria-label="Segna serie completata"
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-md transition",
                        set.completed ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {set.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {session.status !== "COMPLETED" && (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-2xl px-4 md:bottom-4">
          <Button
            className="w-full shadow-lg"
            size="lg"
            loading={completing}
            onClick={() => setSurveyOpen(true)}
          >
            <Flag size={16} /> Completa allenamento
          </Button>
        </div>
      )}

      {restTimer && (
        <RestTimer
          key={restTimer.key}
          seconds={restTimer.seconds}
          onDone={() => setRestTimer(null)}
        />
      )}

      <FatigueSurveyDialog
        open={surveyOpen}
        onClose={() => setSurveyOpen(false)}
        onSubmit={(values) => completeWorkout(values)}
      />
    </div>
  );
}
