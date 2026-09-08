"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import { ClipboardList, Trophy, Activity, Ruler } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { AthleteAnalytics } from "@/components/AthleteAnalytics";
import type { AvatarConfig } from "@/lib/avatar";

interface StudentDetail {
  student: {
    id: string;
    email: string;
    profile: {
      displayName: string;
      bio: string | null;
      photoUrl: string | null;
      useAvatar: boolean;
      avatarConfig: AvatarConfig | null;
    } | null;
  };
  plans: Array<{
    id: string;
    name: string;
    status: string;
    isTemplate: boolean;
    goal: string | null;
    currentVersionNumber: number;
    updatedAt: string;
  }>;
  recentSessions: Array<{
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    day: { name: string } | null;
    plan: { name: string } | null;
  }>;
  personalRecords: Array<{
    id: string;
    exerciseName: string;
    weightKg: number;
    reps: number;
    estimated1RM: number;
    achievedAt: string;
  }>;
  measurements: Array<{
    id: string;
    weightKg: number | null;
    recordedAt: string;
  }>;
  activity: Array<{ id: string; message: string; createdAt: string }>;
}

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const [data, setData] = useState<StudentDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${params.studentId}`)
      .then(async (r) => {
        if (!r.ok) {
          setNotFound(true);
          return;
        }
        setData(await r.json());
      })
      .catch(() => setNotFound(true));
  }, [params.studentId]);

  if (notFound) {
    return (
      <EmptyState title="Allievo non trovato" description="Non hai accesso a questo allievo." />
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { student, plans, recentSessions, personalRecords, measurements, activity } = data;
  const activePlan = plans.find((p) => p.status === "ACTIVE" && !p.isTemplate);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          userId={student.id}
          displayName={student.profile?.displayName ?? student.email}
          photoUrl={student.profile?.photoUrl}
          useAvatar={student.profile?.useAvatar}
          avatarConfig={student.profile?.avatarConfig}
          size={64}
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold sm:text-2xl">{student.profile?.displayName}</h1>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
        <Link href={`/plans/new?studentId=${student.id}`}>
          <Button type="button">
            <ClipboardList size={16} /> Nuova scheda
          </Button>
        </Link>
      </div>

      {student.profile?.bio && (
        <Card>
          <CardContent className="pt-5 text-sm text-muted-foreground">{student.profile.bio}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList size={16} /> Schede
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plans.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna scheda creata per questo allievo.</p>
            )}
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/plans/${plan.id}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm transition hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">{plan.goal ?? "Nessun obiettivo"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={plan.status === "ACTIVE" ? "primary" : "outline"}>
                    {plan.status === "ACTIVE" ? "Attiva" : plan.status === "DRAFT" ? "Bozza" : "Archiviata"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">v{plan.currentVersionNumber}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={16} /> Record recenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {personalRecords.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessun record ancora.</p>
            )}
            {personalRecords.slice(0, 5).map((pr) => (
              <div key={pr.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{pr.exerciseName}</span>
                <span className="font-medium">
                  {pr.weightKg}kg × {pr.reps}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={16} /> Allenamenti recenti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentSessions.length === 0 && (
            <p className="text-sm text-muted-foreground">Nessun allenamento registrato.</p>
          )}
          {recentSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm"
            >
              <div>
                <p className="font-medium">{s.day?.name ?? s.plan?.name ?? "Allenamento"}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(s.startedAt), "d MMM yyyy, HH:mm", { locale: it })}
                </p>
              </div>
              <Badge
                variant={
                  s.status === "COMPLETED" ? "primary" : s.status === "IN_PROGRESS" ? "warning" : "outline"
                }
              >
                {s.status === "COMPLETED"
                  ? "Completato"
                  : s.status === "IN_PROGRESS"
                    ? "In corso"
                    : "Abbandonato"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <AthleteAnalytics studentId={student.id} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler size={16} /> Misurazioni
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {measurements.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna misurazione registrata.</p>
            )}
            {measurements.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {format(new Date(m.recordedAt), "d MMM yyyy", { locale: it })}
                </span>
                <span className="font-medium">{m.weightKg ? `${m.weightKg} kg` : "-"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline attività</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna attività recente.</p>
            )}
            {activity.map((a) => (
              <div key={a.id} className="text-sm">
                <p>{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: it })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
