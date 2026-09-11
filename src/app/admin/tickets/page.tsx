"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { LifeBuoy, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserAvatar } from "@/components/UserAvatar";
import type { AvatarConfig } from "@/lib/avatar";

interface AdminTicket {
  id: string;
  subject: string;
  category: string;
  status: string;
  updatedAt: string;
  author: {
    id: string;
    email: string;
    role: string;
    profile: { displayName: string; photoUrl: string | null; useAvatar: boolean; avatarConfig: AvatarConfig | null } | null;
  };
  _count: { messages: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: "Tecnico",
  ACCOUNT: "Account",
  BILLING: "Fatturazione",
  OTHER: "Altro",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aperto",
  IN_PROGRESS: "In lavorazione",
  CLOSED: "Chiuso",
};

const STATUS_VARIANT: Record<string, "primary" | "warning" | "default"> = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  CLOSED: "default",
};

function TicketsList() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<AdminTicket[] | null>(null);
  const [status, setStatus] = useState(searchParams.get("status") ?? "");

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    fetch(`/api/admin/tickets?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets ?? []))
      .catch(() => setTickets([]));
  }, [status]);

  useEffect(load, [load]);

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Ticket di assistenza</h1>
          <p className="text-sm text-muted-foreground">
            {tickets ? `${tickets.length} ticket` : "Richieste inviate dagli utenti"}
          </p>
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">Tutti gli stati</option>
          <option value="OPEN">Aperti</option>
          <option value="IN_PROGRESS">In lavorazione</option>
          <option value="CLOSED">Chiusi</option>
        </Select>
      </div>

      {tickets === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={<LifeBuoy size={28} />} title="Nessun ticket" />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link key={t.id} href={`/admin/tickets/${t.id}`}>
              <Card className="transition hover:border-primary/40 hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 py-3">
                  <UserAvatar
                    userId={t.author.id}
                    displayName={t.author.profile?.displayName ?? t.author.email}
                    photoUrl={t.author.profile?.photoUrl}
                    useAvatar={t.author.profile?.useAvatar}
                    avatarConfig={t.author.profile?.avatarConfig}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{t.subject}</p>
                      <Badge variant="outline">{CATEGORY_LABELS[t.category] ?? t.category}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.author.profile?.displayName ?? t.author.email} · aggiornato{" "}
                      {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true, locale: it })}
                      {" · "}
                      <MessageSquare size={12} className="inline" /> {t._count.messages}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[t.status] ?? "default"}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsList />
    </Suspense>
  );
}
