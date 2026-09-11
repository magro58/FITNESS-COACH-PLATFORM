"use client";

import { useEffect, useState, useCallback } from "react";
import { Link2, UserX, Unlink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Label } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/UserAvatar";
import type { AvatarConfig } from "@/lib/avatar";

interface BasicUser {
  id: string;
  email: string;
  isActive?: boolean;
  profile: { displayName: string; photoUrl: string | null; useAvatar: boolean; avatarConfig: AvatarConfig | null } | null;
}

interface LinkRow {
  studentId: string;
  createdAt: string;
  trainer: BasicUser;
  student: BasicUser;
}

export default function AdminLinksPage() {
  const toast = useToast();
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [unlinkedStudents, setUnlinkedStudents] = useState<BasicUser[]>([]);
  const [trainers, setTrainers] = useState<BasicUser[]>([]);
  const [students, setStudents] = useState<BasicUser[]>([]);
  const [trainerId, setTrainerId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<LinkRow | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/links")
      .then((r) => r.json())
      .then((data) => {
        setLinks(data.links ?? []);
        setUnlinkedStudents(data.unlinkedStudents ?? []);
      })
      .catch(() => setLinks([]));

    fetch("/api/admin/users?role=TRAINER")
      .then((r) => r.json())
      .then((data) => setTrainers(data.users ?? []))
      .catch(() => {});
    fetch("/api/admin/users?role=STUDENT")
      .then((r) => r.json())
      .then((data) => setStudents(data.users ?? []))
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  function name(u: BasicUser) {
    return u.profile?.displayName ?? u.email;
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    if (!trainerId || !studentId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId, studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore");
      toast.success("Collegamento creato");
      setTrainerId("");
      setStudentId("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setSaving(false);
    }
  }

  async function confirmUnlink() {
    if (!unlinkTarget) return;
    setUnlinking(true);
    try {
      const res = await fetch(`/api/admin/links/${unlinkTarget.studentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore");
      toast.success("Collegamento rimosso");
      setUnlinkTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Collegamenti PT ↔ Allievo</h1>
        <p className="text-sm text-muted-foreground">
          Collega, riassegna o rimuovi manualmente il legame tra un Personal Trainer e un Allievo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuovo collegamento</CardTitle>
          <CardDescription>
            Se l&apos;allievo selezionato è già collegato a un altro PT, verrà riassegnato a quello scelto qui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createLink} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="trainer">Personal Trainer</Label>
              <Select id="trainer" value={trainerId} onChange={(e) => setTrainerId(e.target.value)} required>
                <option value="">Seleziona...</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {name(t)} ({t.email})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="student">Allievo</Label>
              <Select id="student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">Seleziona...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {name(s)} ({s.email})
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" loading={saving} disabled={!trainerId || !studentId}>
              <Link2 size={16} />
              Collega
            </Button>
          </form>
        </CardContent>
      </Card>

      {unlinkedStudents.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserX size={16} className="text-warning" />
              Allievi senza Personal Trainer ({unlinkedStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {unlinkedStudents.map((s) => (
              <button
                key={s.id}
                onClick={() => setStudentId(s.id)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium transition hover:border-primary/40 hover:bg-muted"
              >
                {name(s)}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Collegamenti attivi</h2>
        {links === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <EmptyState icon={<Link2 size={28} />} title="Nessun collegamento attivo" />
        ) : (
          <div className="space-y-2">
            {links.map((l) => (
              <Card key={l.studentId}>
                <CardContent className="flex flex-wrap items-center gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      userId={l.trainer.id}
                      displayName={name(l.trainer)}
                      photoUrl={l.trainer.profile?.photoUrl}
                      useAvatar={l.trainer.profile?.useAvatar}
                      avatarConfig={l.trainer.profile?.avatarConfig}
                      size={32}
                    />
                    <span className="text-sm font-medium">{name(l.trainer)}</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      userId={l.student.id}
                      displayName={name(l.student)}
                      photoUrl={l.student.profile?.photoUrl}
                      useAvatar={l.student.profile?.useAvatar}
                      avatarConfig={l.student.profile?.avatarConfig}
                      size={32}
                    />
                    <span className="text-sm font-medium">{name(l.student)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setUnlinkTarget(l)}
                  >
                    <Unlink size={14} />
                    Scollega
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!unlinkTarget} onClose={() => setUnlinkTarget(null)} title="Confermi la rimozione?">
        {unlinkTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Il collegamento tra <strong>{name(unlinkTarget.trainer)}</strong> e{" "}
              <strong>{name(unlinkTarget.student)}</strong> verrà rimosso. Entrambi riceveranno una notifica.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUnlinkTarget(null)}>
                Annulla
              </Button>
              <Button variant="danger" loading={unlinking} onClick={confirmUnlink}>
                <Unlink size={16} /> Rimuovi collegamento
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
