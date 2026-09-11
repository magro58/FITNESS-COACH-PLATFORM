"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Search, Users as UsersIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserAvatar } from "@/components/UserAvatar";
import type { AvatarConfig } from "@/lib/avatar";

interface AdminUser {
  id: string;
  email: string;
  role: "TRAINER" | "STUDENT" | "ADMIN";
  isActive: boolean;
  oauthProvider: string | null;
  createdAt: string;
  profile: {
    displayName: string;
    photoUrl: string | null;
    useAvatar: boolean;
    avatarConfig: AvatarConfig | null;
  } | null;
}

const ROLE_LABELS: Record<string, string> = {
  TRAINER: "Personal Trainer",
  STUDENT: "Allievo",
  ADMIN: "Admin",
};

function UsersList() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState(searchParams.get("role") ?? "");

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]));
  }, [q, role]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Gestione utenze</h1>
        <p className="text-sm text-muted-foreground">
          {users ? `${users.length} account trovati` : "Cerca e gestisci gli account registrati"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca per nome o email..."
            className="pl-9"
          />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-56">
          <option value="">Tutti i ruoli</option>
          <option value="TRAINER">Personal Trainer</option>
          <option value="STUDENT">Allievo</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      {users === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={<UsersIcon size={28} />} title="Nessun utente trovato" />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Link key={u.id} href={`/admin/users/${u.id}`}>
              <Card className="transition hover:border-primary/40 hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 py-3">
                  <UserAvatar
                    userId={u.id}
                    displayName={u.profile?.displayName ?? u.email}
                    photoUrl={u.profile?.photoUrl}
                    useAvatar={u.profile?.useAvatar}
                    avatarConfig={u.profile?.avatarConfig}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.profile?.displayName ?? u.email}
                      {!u.isActive && (
                        <Badge variant="danger" className="ml-2">
                          Disabilitato
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email} · registrato{" "}
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true, locale: it })}
                    </p>
                  </div>
                  <Badge variant={u.role === "ADMIN" ? "accent" : "outline"}>{ROLE_LABELS[u.role]}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersList />
    </Suspense>
  );
}
