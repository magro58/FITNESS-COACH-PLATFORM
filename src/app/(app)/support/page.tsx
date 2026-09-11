"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { LifeBuoy, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface TicketSummary {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: "Tecnico",
  ACCOUNT: "Account",
  BILLING: "Fatturazione",
  OTHER: "Altro",
};

const STATUS_VARIANT: Record<string, "primary" | "warning" | "default"> = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  CLOSED: "default",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aperto",
  IN_PROGRESS: "In lavorazione",
  CLOSED: "Chiuso",
};

export default function SupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/support/tickets")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets ?? []))
      .catch(() => setTickets([]));
  }

  useEffect(load, []);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore");
      toast.success("Richiesta inviata");
      setOpen(false);
      setSubject("");
      setCategory("OTHER");
      setMessage("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante l'invio");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Assistenza</h1>
          <p className="text-sm text-muted-foreground">
            Apri una richiesta al nostro team e segui lo stato delle tue conversazioni.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          Nuovo ticket
        </Button>
      </div>

      {tickets === null ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy size={28} />}
          title="Nessuna richiesta"
          description="Non hai ancora aperto ticket di assistenza."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              Apri il primo ticket
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/support/${t.id}`}>
              <Card className="transition hover:border-primary/40 hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{t.subject}</p>
                      <Badge variant="outline">{CATEGORY_LABELS[t.category] ?? t.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aggiornato {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true, locale: it })}
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

      <Dialog open={open} onClose={() => setOpen(false)} title="Nuova richiesta di assistenza">
        <form onSubmit={submitTicket} className="space-y-4">
          <div>
            <Label htmlFor="subject">Oggetto</Label>
            <Input
              id="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Es. Non riesco a caricare la foto profilo"
              maxLength={150}
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="TECHNICAL">Tecnico</option>
              <option value="ACCOUNT">Account</option>
              <option value="BILLING">Fatturazione</option>
              <option value="OTHER">Altro</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="message">Descrivi il problema</Label>
            <Textarea
              id="message"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Racconta cosa è successo, il più nel dettaglio possibile"
              maxLength={4000}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" loading={submitting}>
              Invia richiesta
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
