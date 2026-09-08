"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

const FIELDS: Array<{ key: string; label: string }> = [
  { key: "fatigue", label: "Fatica percepita" },
  { key: "energy", label: "Energia" },
  { key: "recovery", label: "Recupero percepito" },
  { key: "sleepQuality", label: "Qualità del sonno" },
  { key: "stress", label: "Stress percepito" },
  { key: "doms", label: "Dolori muscolari (DOMS)" },
  { key: "difficulty", label: "Difficoltà dell'allenamento" },
  { key: "motivation", label: "Motivazione" },
];

export function FatigueSurveyDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, number>) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>({});

  return (
    <Dialog open={open} onClose={onClose} title="Come è andata?">
      <p className="mb-4 text-sm text-muted-foreground">
        Facoltativo: aiuta il tuo Personal Trainer a monitorare il tuo stato di forma.
      </p>
      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{f.label}</span>
              <span className="font-medium">{values[f.key] ?? "-"}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={values[f.key] ?? 5}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }))}
              className="w-full accent-[var(--primary)]"
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={() => onSubmit({})}>
          Salta
        </Button>
        <Button type="button" onClick={() => onSubmit(values)}>
          Invia e completa
        </Button>
      </div>
    </Dialog>
  );
}
