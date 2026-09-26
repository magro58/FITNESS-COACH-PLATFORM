"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function DemoBanner({ role }: { role: "TRAINER" | "STUDENT" }) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground sm:text-sm">
      <Sparkles size={15} className="shrink-0" />
      <span>
        Stai esplorando una <strong>demo pubblica</strong> come {role === "TRAINER" ? "Personal Trainer" : "Allievo"}
        — i dati sono di esempio e si azzerano ad ogni accesso.
      </span>
      <button
        onClick={() => router.push("/demo")}
        className="ml-1 rounded-md bg-black/10 px-2.5 py-1 font-semibold hover:bg-black/20"
      >
        Cambia ruolo
      </button>
    </div>
  );
}
