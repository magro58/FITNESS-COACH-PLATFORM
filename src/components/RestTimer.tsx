"use client";

import { useEffect, useState } from "react";
import { Timer, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = 1 - remaining / seconds;

  return (
    <div className="fixed inset-x-0 bottom-36 z-50 mx-auto max-w-md px-4 md:bottom-24">
      <div className="animate-fade-in flex items-center gap-3 rounded-xl border border-primary/30 bg-card/95 p-3 shadow-xl backdrop-blur">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <svg className="absolute h-12 w-12 -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="19" fill="none" stroke="var(--muted)" strokeWidth="4" />
            <circle
              cx="22"
              cy="22"
              r="19"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 19}
              strokeDashoffset={2 * Math.PI * 19 * (1 - progress)}
              strokeLinecap="round"
            />
          </svg>
          <Timer size={16} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Recupero</p>
          <p className="text-lg font-bold tabular-nums">
            {minutes}:{secs.toString().padStart(2, "0")}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          <X size={14} /> Salta
        </Button>
      </div>
    </div>
  );
}
