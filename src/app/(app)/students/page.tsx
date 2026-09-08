"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { UserPlus, Copy, Check, Flame, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import type { AvatarConfig } from "@/lib/avatar";

interface StudentSummary {
  studentId: string;
  linkedAt: string;
  email: string;
  profile: {
    displayName: string;
    photoUrl: string | null;
    useAvatar: boolean;
    avatarConfig: AvatarConfig | null;
  } | null;
  lastSessionAt: string | null;
  activePlanName: string | null;
  hasRecentPR: boolean;
  sessionsLast7Days: number;
}

export default function StudentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState<StudentSummary[] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .catch(() => setStudents([]));
  }, []);

  async function generateInvite() {
    setGenerating(true);
    setCopied(false);
    try {
      const res = await fetch("/api/invite-codes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setInviteCode(data.invite.code);
    } catch {
      toast.error("Errore nella generazione del codice");
    } finally {
      setGenerating(false);
    }
  }

  function openInviteModal() {
    setInviteOpen(true);
    setInviteCode(null);
    generateInvite();
  }

  async function copyCode() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">I tuoi allievi</h1>
          <p className="text-sm text-muted-foreground">
            {students ? `${students.length} allievi collegati` : "Caricamento..."}
          </p>
        </div>
        <Button onClick={openInviteModal}>
          <UserPlus size={16} /> Invita allievo
        </Button>
      </div>

      {students === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {students?.length === 0 && (
        <EmptyState
          icon={<Users size={32} />}
          title="Nessun allievo collegato"
          description="Genera un codice invito e condividilo con il tuo allievo per collegarlo al tuo account."
          action={
            <Button onClick={openInviteModal}>
              <UserPlus size={16} /> Invita il primo allievo
            </Button>
          }
        />
      )}

      {students && students.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link key={s.studentId} href={`/students/${s.studentId}`}>
              <Card className="h-full transition hover:border-primary/50 hover:shadow-md">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      userId={s.studentId}
                      displayName={s.profile?.displayName ?? s.email}
                      photoUrl={s.profile?.photoUrl}
                      useAvatar={s.profile?.useAvatar}
                      avatarConfig={s.profile?.avatarConfig}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{s.profile?.displayName ?? s.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    {s.hasRecentPR && (
                      <Badge variant="accent" title="Nuovo record personale">
                        <Flame size={12} /> PR
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Scheda attiva</span>
                      <span className="font-medium text-foreground">
                        {s.activePlanName ?? "Nessuna"}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Ultimo allenamento</span>
                      <span className="font-medium text-foreground">
                        {s.lastSessionAt
                          ? formatDistanceToNow(new Date(s.lastSessionAt), {
                              addSuffix: true,
                              locale: it,
                            })
                          : "Mai"}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Ultimi 7 giorni</span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <TrendingUp size={13} /> {s.sessionsLast7Days} allenamenti
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invita un allievo">
        <p className="mb-4 text-sm text-muted-foreground">
          Condividi questo codice con il tuo allievo: potrà inserirlo in fase di registrazione (o
          successivamente dal proprio profilo) per collegarsi al tuo account. Il codice è valido 7
          giorni.
        </p>
        {generating && <Skeleton className="h-14" />}
        {inviteCode && !generating && (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-border bg-muted px-4 py-3 text-center text-2xl font-bold tracking-widest">
              {inviteCode}
            </div>
            <Button type="button" variant="outline" size="icon" onClick={copyCode}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        )}
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={generateInvite}>
          Genera un nuovo codice
        </Button>
      </Dialog>
    </div>
  );
}
