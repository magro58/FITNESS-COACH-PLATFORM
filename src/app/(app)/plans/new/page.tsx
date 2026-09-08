"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlanBuilder } from "@/components/plan-builder/PlanBuilder";

function NewPlanInner() {
  const params = useSearchParams();
  const studentId = params.get("studentId") ?? undefined;
  return <PlanBuilder mode="create" preselectStudentId={studentId} />;
}

export default function NewPlanPage() {
  return (
    <Suspense fallback={null}>
      <NewPlanInner />
    </Suspense>
  );
}
