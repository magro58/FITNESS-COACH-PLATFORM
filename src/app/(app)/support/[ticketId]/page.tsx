"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/components/user-context";
import { cn } from "@/lib/cn";

interface TicketMessage {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; role: string; profile: { displayName: string } | null };
}

interface TicketDetail {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  messages: TicketMessage[];
}

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

export default function SupportTicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const router = useRouter();
  const toast = useToast();
  const user = useCurrentUser();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function load() {
    fetch(`/api/support/tickets/${ticketId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setTicket(data.ticket))
      .catch(() => setTicket(null));
  }

  useEffect(load, [ticketId]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      if (!res.ok) throw new Error();
      setReply("");
      load();
    } catch {
      toast.error("Invio non riuscito, riprova");
    } finally {
      setSending(false);
    }
  }

  if (ticket === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 animate-fade-in">
      <button
        onClick={() => router.push("/support")}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Tutti i ticket
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">{ticket.subject}</h1>
          <p className="text-xs text-muted-foreground">
            Aperto il {format(new Date(ticket.createdAt), "d MMMM yyyy", { locale: it })}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[ticket.status] ?? "default"}>
          {STATUS_LABELS[ticket.status] ?? ticket.status}
        </Badge>
      </div>

      <div className="space-y-3">
        {ticket.messages.map((m) => {
          const isAdmin = m.author.role === "ADMIN";
          const isMine = m.author.id === user.id;
          return (
            <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <Card
                className={cn(
                  "max-w-[85%] sm:max-w-[75%]",
                  isMine ? "bg-primary text-primary-foreground" : "bg-card"
                )}
              >
                <CardContent className="py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs opacity-80">
                    {isAdmin && <ShieldCheck size={12} />}
                    {isAdmin ? "Assistenza" : m.author.profile?.displayName ?? "Tu"}
                    <span>·</span>
                    <span>{format(new Date(m.createdAt), "d MMM, HH:mm", { locale: it })}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                </CardContent>
              </Card>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendReply} className="flex gap-2">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Scrivi una risposta..."
          className="min-h-[46px] flex-1"
          maxLength={4000}
        />
        <Button type="submit" size="icon" loading={sending} disabled={!reply.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
