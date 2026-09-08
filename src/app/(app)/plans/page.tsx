"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Plus, ClipboardList, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface PlanSummary {
  id: string;
  name: string;
  goal: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isTemplate: boolean;
  currentVersionNumber: number;
  updatedAt: string;
  student: { profile: { displayName: string } | null } | null;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const toast = useToast();

  function load() {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []));
  }

  useEffect(load, []);

  async function duplicate(id: string) {
    const res = await fetch(`/api/plans/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      toast.success("Scheda duplicata");
      load();
    } else {
      toast.error("Errore durante la duplicazione");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Schede di allenamento</h1>
          <p className="text-sm text-muted-foreground">
            {plans ? `${plans.length} schede totali` : "Caricamento..."}
          </p>
        </div>
        <Link href="/plans/new">
          <Button>
            <Plus size={16} /> Nuova scheda
          </Button>
        </Link>
      </div>

      {plans === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      )}

      {plans?.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="Nessuna scheda creata"
          description="Crea la tua prima scheda di allenamento personalizzata."
          action={
            <Link href="/plans/new">
              <Button>
                <Plus size={16} /> Crea la prima scheda
              </Button>
            </Link>
          }
        />
      )}

      {plans && plans.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col transition hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex flex-1 flex-col gap-2 pt-5">
                <Link href={`/plans/${plan.id}`} className="flex-1">
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">{plan.goal ?? "Nessun obiettivo"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant={plan.status === "ACTIVE" ? "primary" : "outline"}>
                      {plan.status === "ACTIVE" ? "Attiva" : plan.status === "DRAFT" ? "Bozza" : "Archiviata"}
                    </Badge>
                    {plan.isTemplate && <Badge variant="accent">Template</Badge>}
                    <Badge variant="outline">v{plan.currentVersionNumber}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {plan.student?.profile?.displayName ? `Assegnata a ${plan.student.profile.displayName}` : "Non assegnata"}
                    {" · "}
                    Aggiornata {formatDistanceToNow(new Date(plan.updatedAt), { addSuffix: true, locale: it })}
                  </p>
                </Link>
                <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => duplicate(plan.id)}>
                  <Copy size={13} /> Duplica
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
