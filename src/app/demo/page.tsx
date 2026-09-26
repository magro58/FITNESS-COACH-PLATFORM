"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, GraduationCap, Sparkles, Loader2 } from "lucide-react";

export default function DemoLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"TRAINER" | "STUDENT" | null>(null);

  async function enter(role: "TRAINER" | "STUDENT") {
    setLoading(role);
    try {
      const res = await fetch("/api/demo/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 px-4 py-10">
      <div className="w-full max-w-lg animate-fade-in text-center">
        <div className="mb-4 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Dumbbell size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Fitness Coach Platform</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary">
            <Sparkles size={14} /> Demo pubblica — nessuna registrazione richiesta
          </p>
        </div>

        <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
          Esplora l&apos;app con dati di esempio già pronti: scheda di allenamento, allenamenti
          completati, record personali, grafici e dashboard. I dati si azzerano e si rigenerano
          automaticamente ad ogni accesso, quindi sentiti libero di provare tutto.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => enter("TRAINER")}
            disabled={loading !== null}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-left shadow-sm transition hover:border-primary/40 hover:bg-muted/40 disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {loading === "TRAINER" ? <Loader2 size={20} className="animate-spin" /> : <Dumbbell size={20} />}
            </div>
            <span className="font-semibold">Entra come Personal Trainer</span>
            <span className="text-xs text-muted-foreground">
              Gestione allievi, builder schede, dashboard PT
            </span>
          </button>

          <button
            onClick={() => enter("STUDENT")}
            disabled={loading !== null}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-left shadow-sm transition hover:border-primary/40 hover:bg-muted/40 disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              {loading === "STUDENT" ? <Loader2 size={20} className="animate-spin" /> : <GraduationCap size={20} />}
            </div>
            <span className="font-semibold">Entra come Allievo</span>
            <span className="text-xs text-muted-foreground">
              Scheda assegnata, allenamento guidato, progressi
            </span>
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Progetto personale a scopo dimostrativo. L&apos;upload di file e l&apos;invio di ticket
          di assistenza sono disattivati in modalità demo.
        </p>
      </div>
    </div>
  );
}
