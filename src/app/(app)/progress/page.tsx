"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { useCurrentUser } from "@/components/user-context";
import { AthleteAnalytics } from "@/components/AthleteAnalytics";
import { MeasurementForm } from "@/components/MeasurementForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function ProgressPage() {
  const user = useCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">I miei progressi</h1>
        <p className="text-sm text-muted-foreground">
          Il tuo andamento nel tempo: volume, carichi, frequenza e forma fisica.
        </p>
      </div>

      <AthleteAnalytics key={refreshKey} studentId={user.id} />

      <MeasurementForm onSaved={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}
