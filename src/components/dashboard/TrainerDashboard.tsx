"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Users, Activity, Trophy, AlertTriangle, ClipboardList, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/Button";
import type { AvatarConfig } from "@/lib/avatar";

interface DashboardData {
  totalStudents: number;
  activeStudents: number;
  recentCompletions: Array<{
    id: string;
    completedAt: string | null;
    day: { name: string } | null;
    student: { id: string; profile: { displayName: string; photoUrl: string | null; useAvatar: boolean; avatarConfig: AvatarConfig | null } | null };
  }>;
  newRecords: Array<{
    id: string;
    exerciseName: string;
    weightKg: number;
    reps: number;
    achievedAt: string;
    student: { id: string; profile: { displayName: string } | null };
  }>;
  recentlyModifiedPlans: Array<{
    id: string;
    name: string;
    updatedAt: string;
    student: { profile: { displayName: string } | null } | null;
  }>;
  needsAttention: Array<{ studentId: string; profile: { displayName: string; photoUrl: string | null; useAvatar: boolean; avatarConfig: AvatarConfig | null } | null }>;
  timeline: Array<{ id: string; message: string; createdAt: string; student: { profile: { displayName: string } | null } }>;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrainerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/trainer")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Panoramica dei tuoi allievi e delle attività recenti.</p>
        </div>
        <Link href="/students">
          <Button size="sm">
            <UserPlus size={15} /> Gestisci allievi
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Users size={18} />} label="Allievi totali" value={data.totalStudents} />
        <StatCard icon={<Activity size={18} />} label="Attivi (14gg)" value={data.activeStudents} />
        <StatCard icon={<Trophy size={18} />} label="Record recenti" value={data.newRecords.length} />
        <StatCard icon={<AlertTriangle size={18} />} label="Da monitorare" value={data.needsAttention.length} />
      </div>

      {data.needsAttention.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle size={16} /> Allievi che richiedono attenzione
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {data.needsAttention.map((s) => (
              <Link
                key={s.studentId}
                href={`/students/${s.studentId}`}
                className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm hover:bg-warning/10"
              >
                <UserAvatar
                  userId={s.studentId}
                  displayName={s.profile?.displayName ?? ""}
                  photoUrl={s.profile?.photoUrl}
                  useAvatar={s.profile?.useAvatar}
                  avatarConfig={s.profile?.avatarConfig}
                  size={22}
                />
                {s.profile?.displayName}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allenamenti completati di recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentCompletions.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessun allenamento completato ancora.</p>
            )}
            {data.recentCompletions.map((s) => (
              <Link
                key={s.id}
                href={`/students/${s.student.id}`}
                className="flex items-center gap-3 rounded-md p-1.5 text-sm hover:bg-muted"
              >
                <UserAvatar
                  userId={s.student.id}
                  displayName={s.student.profile?.displayName ?? ""}
                  photoUrl={s.student.profile?.photoUrl}
                  useAvatar={s.student.profile?.useAvatar}
                  avatarConfig={s.student.profile?.avatarConfig}
                  size={32}
                />
                <div className="flex-1">
                  <p>
                    <span className="font-medium">{s.student.profile?.displayName}</span> ha completato{" "}
                    {s.day?.name ?? "un allenamento"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.completedAt && formatDistanceToNow(new Date(s.completedAt), { addSuffix: true, locale: it })}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={16} className="text-accent" /> Nuovi record personali
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.newRecords.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessun nuovo record questa settimana.</p>
            )}
            {data.newRecords.map((r) => (
              <Link
                key={r.id}
                href={`/students/${r.student.id}`}
                className="flex items-center justify-between rounded-md p-1.5 text-sm hover:bg-muted"
              >
                <span>
                  <span className="font-medium">{r.student.profile?.displayName}</span> — {r.exerciseName}
                </span>
                <span className="font-semibold text-accent">
                  {r.weightKg}kg×{r.reps}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList size={16} /> Schede modificate di recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentlyModifiedPlans.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna scheda ancora.</p>
            )}
            {data.recentlyModifiedPlans.map((p) => (
              <Link
                key={p.id}
                href={`/plans/${p.id}`}
                className="flex items-center justify-between rounded-md p-1.5 text-sm hover:bg-muted"
              >
                <span>
                  {p.name}
                  {p.student?.profile?.displayName && (
                    <span className="text-muted-foreground"> · {p.student.profile.displayName}</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true, locale: it })}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline attività</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.timeline.length === 0 && (
              <EmptyState title="Nessuna attività recente" className="border-none py-6" />
            )}
            {data.timeline.map((e) => (
              <div key={e.id} className="text-sm">
                <p>
                  <span className="font-medium">{e.student.profile?.displayName}</span> {e.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale: it })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
