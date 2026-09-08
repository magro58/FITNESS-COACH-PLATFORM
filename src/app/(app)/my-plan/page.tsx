"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

interface MyPlan {
  id: string;
  name: string;
  goal: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  currentVersionNumber: number;
  trainer: { profile: { displayName: string } | null };
}

export default function MyPlanListPage() {
  const [plans, setPlans] = useState<MyPlan[] | null>(null);

  useEffect(() => {
    fetch("/api/my-plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Le mie schede</h1>
        <p className="text-sm text-muted-foreground">Le schede assegnate dal tuo Personal Trainer.</p>
      </div>

      {plans === null && <Skeleton className="h-32" />}

      {plans?.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="Nessuna scheda assegnata"
          description="Il tuo Personal Trainer non ti ha ancora assegnato una scheda."
        />
      )}

      {plans && plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/my-plan/${plan.id}`}>
              <Card className="transition hover:border-primary/50 hover:shadow-md">
                <CardContent className="flex items-center justify-between pt-5">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.goal ?? "Nessun obiettivo"} · PT: {plan.trainer.profile?.displayName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={plan.status === "ACTIVE" ? "primary" : "outline"}>
                      {plan.status === "ACTIVE" ? "Attiva" : "Archiviata"}
                    </Badge>
                    <Badge variant="outline">v{plan.currentVersionNumber}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
