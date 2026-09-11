"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Ban, CheckCircle2, Trash2, Mail, Calendar, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/UserAvatar";
import type { AvatarConfig } from "@/lib/avatar";

interface AdminUserDetail {
  id: string;
  email: string;
  role: "TRAINER" | "STUDENT" | "ADMIN";
  isActive: boolean;
  oauthProvider: string | null;
  createdAt: string;
  profile: { displayName: string; bio: string | null; photoUrl: string | null; useAvatar: boolean; avatarConfig: AvatarConfig | null } | null;
  studentsCount: number;
  linkedTrainer: { email: string; profile: { displayName: string } | null } | null;
  plansCount: number;
  sessionsCount: number;
  ticketsCount: number;
}

const ROLE_LABELS: Record<string, string> = {
  TRAINER: "Personal Trainer",
  STUDENT: "Allievo",
  ADMIN: "Admin",
};

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function load() {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }

  useEffect(load, [userId]);

  async function toggleActive() {
    if (!user) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore");
      toast.success(user.isActive ? "Account disabilitato" : "Account riattivato");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore");
      toast.success("Account eliminato");
      router.push("/admin/users");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
      setBusy(false);
    }
  }

  if (user === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in">
      <button
        onClick={() => router.push("/admin/users")}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Tutti gli utenti
      </button>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center sm:flex-row sm:items-start sm:text-left">
          <UserAvatar
            userId={user.id}
            displayName={user.profile?.displayName ?? user.email}
            photoUrl={user.profile?.photoUrl}
            useAvatar={user.profile?.useAvatar}
            avatarConfig={user.profile?.avatarConfig}
            size={72}
          />
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-lg font-bold">{user.profile?.displayName ?? user.email}</h1>
              <Badge variant={user.role === "ADMIN" ? "accent" : "outline"}>{ROLE_LABELS[user.role]}</Badge>
              {!user.isActive && <Badge variant="danger">Disabilitato</Badge>}
            </div>
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <Mail size={13} /> {user.email}
              {user.oauthProvider && ` · accesso via ${user.oauthProvider}`}
            </p>
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <Calendar size={13} /> Registrato il {format(new Date(user.createdAt), "d MMMM yyyy", { locale: it })}
            </p>
            {user.profile?.bio && <p className="pt-1 text-sm">{user.profile.bio}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attività</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {user.role === "TRAINER" && (
            <>
              <Stat label="Allievi collegati" value={user.studentsCount} />
              <Stat label="Schede create" value={user.plansCount} />
            </>
          )}
          {user.role === "STUDENT" && (
            <>
              <Stat label="Allenamenti completati" value={user.sessionsCount} />
              <Stat
                label="Trainer collegato"
                value={user.linkedTrainer?.profile?.displayName ?? user.linkedTrainer?.email ?? "Nessuno"}
              />
            </>
          )}
          <Stat label="Ticket assistenza" value={user.ticketsCount} />
        </CardContent>
      </Card>

      {user.role !== "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Azioni</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button variant={user.isActive ? "outline" : "primary"} loading={busy} onClick={toggleActive}>
              {user.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
              {user.isActive ? "Disabilita account" : "Riattiva account"}
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy}>
              <Trash2 size={16} />
              Elimina account
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Confermi l'eliminazione?">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            L&apos;account di <strong>{user.profile?.displayName ?? user.email}</strong> e tutti i dati collegati
            (schede, allenamenti, media, ticket) verranno eliminati permanentemente. L&apos;operazione non è
            reversibile.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Annulla
            </Button>
            <Button variant="danger" loading={busy} onClick={deleteUser}>
              <Trash2 size={16} /> Elimina definitivamente
            </Button>
          </div>
        </div>
      </Dialog>

      {user.ticketsCount > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LifeBuoy size={13} /> Vedi i ticket di questo utente nella sezione{" "}
          <a href="/admin/tickets" className="text-primary hover:underline">
            Ticket
          </a>
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2.5">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
