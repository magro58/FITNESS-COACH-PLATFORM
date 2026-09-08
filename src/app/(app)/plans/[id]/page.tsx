"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { PlanBuilder } from "@/components/plan-builder/PlanBuilder";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { clientId, type BuilderPlan } from "@/lib/plan-builder-types";
import type { PlanDay, PlanExercise } from "@prisma/client";

type ApiDay = PlanDay & { exercises: PlanExercise[] };

export default function EditPlanPage() {
  const params = useParams<{ id: string }>();
  const [builderPlan, setBuilderPlan] = useState<BuilderPlan | null>(null);
  const [meta, setMeta] = useState<{ versionNumber: number; isAssigned: boolean } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/plans/${params.id}`)
      .then(async (r) => {
        if (!r.ok) {
          setError(true);
          return;
        }
        const data = await r.json();
        const p = data.plan;
        const version = p.versions[0];
        setBuilderPlan({
          name: p.name,
          description: p.description ?? "",
          goal: p.goal ?? "",
          startDate: p.startDate ? format(new Date(p.startDate), "yyyy-MM-dd") : "",
          endDate: p.endDate ? format(new Date(p.endDate), "yyyy-MM-dd") : "",
          notes: p.notes ?? "",
          isTemplate: p.isTemplate,
          studentId: p.studentId,
          days: (version?.days ?? []).map((d: ApiDay) => ({
            clientId: clientId("day"),
            id: d.id,
            name: d.name,
            notes: d.notes ?? "",
            exercises: d.exercises.map((e) => ({ ...e, clientId: clientId("ex") })),
          })),
        });
        setMeta({ versionNumber: p.currentVersionNumber, isAssigned: !!p.studentId });
      })
      .catch(() => setError(true));
  }, [params.id]);

  if (error) {
    return <EmptyState title="Scheda non trovata" description="Non hai accesso a questa scheda." />;
  }

  if (!builderPlan) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <PlanBuilder
      mode="edit"
      planId={params.id}
      initialPlan={builderPlan}
      currentVersionNumber={meta?.versionNumber}
      isAssigned={meta?.isAssigned}
    />
  );
}
