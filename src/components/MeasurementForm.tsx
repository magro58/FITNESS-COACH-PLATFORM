"use client";

import { useState } from "react";
import { Ruler, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const FIELDS: Array<{ key: string; label: string; suffix: string }> = [
  { key: "weightKg", label: "Peso", suffix: "kg" },
  { key: "bodyFatPct", label: "Massa grassa", suffix: "%" },
  { key: "chestCm", label: "Torace", suffix: "cm" },
  { key: "waistCm", label: "Vita", suffix: "cm" },
  { key: "hipsCm", label: "Fianchi", suffix: "cm" },
  { key: "armCm", label: "Braccio", suffix: "cm" },
  { key: "thighCm", label: "Coscia", suffix: "cm" },
];

export function MeasurementForm({ onSaved }: { onSaved?: () => void }) {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(values)
          .filter(([, v]) => v !== "")
          .map(([k, v]) => [k, Number(v)])
      );
      if (Object.keys(payload).length === 0) {
        toast.error("Inserisci almeno un valore");
        return;
      }
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Misurazione registrata");
      setValues({});
      onSaved?.();
    } catch {
      toast.error("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler size={16} /> Nuova misurazione
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="text-xs">
                  {f.label} ({f.suffix})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <Button type="submit" size="sm" loading={saving}>
            <Plus size={14} /> Salva misurazione
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
