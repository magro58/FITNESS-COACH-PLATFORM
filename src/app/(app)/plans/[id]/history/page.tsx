"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface VersionEntry {
  id: string;
  versionNumber: number;
  note: string | null;
  createdAt: string;
}

export default function PlanHistoryPage() {
  const params = useParams<{ id: string }>();
  const [versions, setVersions] = useState<VersionEntry[] | null>(null);
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    fetch(`/api/plans/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setVersions(d.versionHistory ?? []);
        setPlanName(d.plan?.name ?? "");
      });
  }, [params.id]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <History size={20} /> Storico versioni
        </h1>
        <p className="text-sm text-muted-foreground">{planName}</p>
      </div>

      {versions === null && <Skeleton className="h-40" />}

      {versions && (
        <div className="space-y-3">
          {versions.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-start justify-between gap-3 pt-5">
                <div>
                  <p className="font-medium">{v.note ?? "Nessuna nota"}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(v.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                  </p>
                </div>
                <Badge variant={v.versionNumber === versions[0].versionNumber ? "primary" : "outline"}>
                  v{v.versionNumber}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
