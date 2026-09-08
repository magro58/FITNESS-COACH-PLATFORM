"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ExternalLink, Image as ImageIcon, Video as VideoIcon, Inbox, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { MediaComposer } from "@/components/MediaComposer";
import { LinkComposer } from "@/components/LinkComposer";
import { useCurrentUser } from "@/components/user-context";
import { cn } from "@/lib/cn";

interface MediaItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  note: string | null;
  context: string;
  createdAt: string;
  uploaderId: string;
  recipientId: string;
  uploader: { profile: { displayName: string } | null };
  recipient: { profile: { displayName: string } | null };
}

interface LinkItem {
  id: string;
  url: string;
  title: string | null;
  note: string | null;
  createdAt: string;
  senderId: string;
  sender: { profile: { displayName: string } | null };
  recipient: { profile: { displayName: string } | null };
}

const CONTEXT_LABEL: Record<string, string> = {
  GENERAL: "Generale",
  PHYSICAL_UPDATE: "Aggiornamento fisico",
  SESSION: "Allenamento",
  EXERCISE: "Esercizio",
  PLAN: "Scheda",
};

function MediaPageInner() {
  const user = useCurrentUser();
  const params = useSearchParams();
  const initialTab = params.get("tab") === "links" ? "links" : "media";
  const highlight = params.get("highlight");

  const [tab, setTab] = useState<"media" | "links">(initialTab);
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [links, setLinks] = useState<LinkItem[] | null>(null);

  function loadMedia() {
    fetch("/api/media")
      .then((r) => r.json())
      .then((d) => setMedia(d.media ?? []));
  }
  function loadLinks() {
    fetch("/api/links")
      .then((r) => r.json())
      .then((d) => setLinks(d.links ?? []));
  }

  useEffect(() => {
    loadMedia();
    loadLinks();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Media e comunicazioni</h1>
        <p className="text-sm text-muted-foreground">
          {user.role === "STUDENT"
            ? "Invia foto e video al tuo Personal Trainer, e ricevi contenuti da lui."
            : "Invia foto, video e link ai tuoi allievi, e ricevi i loro contenuti."}
        </p>
      </div>

      <MediaComposer onSent={loadMedia} />
      {user.role === "TRAINER" && <LinkComposer onSent={loadLinks} />}

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("media")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
            tab === "media" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          )}
        >
          <ImageIcon size={14} /> Foto e video
        </button>
        <button
          onClick={() => setTab("links")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
            tab === "links" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          )}
        >
          <ExternalLink size={14} /> Link
        </button>
      </div>

      {tab === "media" && (
        <div className="space-y-3">
          {media === null && <Skeleton className="h-40" />}
          {media?.length === 0 && (
            <EmptyState icon={<Inbox size={28} />} title="Nessun media ancora" />
          )}
          {media?.map((m) => {
            const isReceived = m.recipientId === user.id;
            return (
              <Card
                key={m.id}
                id={`media-${m.id}`}
                className={cn(m.id === highlight && "ring-2 ring-primary")}
              >
                <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row">
                  <div className="w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-40">
                    {m.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/media/${m.id}/file`}
                        alt={m.note ?? "Foto"}
                        className="h-40 w-full object-cover sm:h-28"
                      />
                    ) : (
                      <video src={`/api/media/${m.id}/file`} controls className="h-40 w-full object-cover sm:h-28" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isReceived ? "primary" : "outline"}>
                        {isReceived ? <Inbox size={11} /> : <Send size={11} />}
                        {isReceived ? "Ricevuto" : "Inviato"}
                      </Badge>
                      <Badge variant="outline">{CONTEXT_LABEL[m.context] ?? m.context}</Badge>
                    </div>
                    <p className="text-sm">
                      {isReceived ? "Da" : "A"}{" "}
                      <span className="font-medium">
                        {(isReceived ? m.uploader : m.recipient).profile?.displayName}
                      </span>
                    </p>
                    {m.note && <p className="text-sm text-muted-foreground">{m.note}</p>}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(m.createdAt), "d MMM yyyy, HH:mm", { locale: it })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "links" && (
        <div className="space-y-3">
          {links === null && <Skeleton className="h-24" />}
          {links?.length === 0 && <EmptyState icon={<ExternalLink size={28} />} title="Nessun link ancora" />}
          {links?.map((l) => {
            const isReceived = l.senderId !== user.id;
            return (
              <Card key={l.id} id={`link-${l.id}`} className={cn(l.id === highlight && "ring-2 ring-primary")}>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isReceived ? "primary" : "outline"}>
                      {isReceived ? <Inbox size={11} /> : <Send size={11} />}
                      {isReceived ? "Ricevuto" : "Inviato"}
                    </Badge>
                  </div>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <VideoIcon size={14} /> {l.title ?? l.url}
                  </a>
                  {l.note && <p className="mt-1 text-sm text-muted-foreground">{l.note}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isReceived ? "Da" : "A"}{" "}
                    {(isReceived ? l.sender : l.recipient).profile?.displayName} ·{" "}
                    {format(new Date(l.createdAt), "d MMM yyyy, HH:mm", { locale: it })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MediaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <MediaPageInner />
    </Suspense>
  );
}
