"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ExercisePicker } from "./ExercisePicker";
import type { BuilderExercise } from "@/lib/plan-builder-types";
import { cn } from "@/lib/cn";

function num(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function NumField({
  label,
  value,
  onChange,
  step,
  suffix,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  step?: string;
  suffix?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step={step ?? "1"}
          value={value ?? ""}
          onChange={(e) => onChange(num(e.target.value))}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        checked ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}

export function ExerciseEditorDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: BuilderExercise;
  onClose: () => void;
  onSave: (ex: BuilderExercise) => void;
}) {
  const [ex, setEx] = useState<BuilderExercise>(initial);

  function set<K extends keyof BuilderExercise>(key: K, value: BuilderExercise[K]) {
    setEx((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onClose={onClose} title="Configura esercizio" className="max-w-2xl">
      <div className="space-y-5">
        <div>
          <Label>Esercizio</Label>
          <ExercisePicker
            value={ex.customName}
            onSelect={(opt) =>
              setEx((prev) => ({
                ...prev,
                customName: opt.name,
                exerciseId: opt.id ?? null,
                muscleGroup: opt.muscleGroup ?? prev.muscleGroup,
                videoUrl: opt.videoUrl ?? prev.videoUrl,
                imageUrl: opt.imageUrl ?? prev.imageUrl,
              }))
            }
          />
        </div>
        <div>
          <Label className="text-xs">Gruppo muscolare</Label>
          <Input
            value={ex.muscleGroup ?? ""}
            onChange={(e) => set("muscleGroup", e.target.value)}
            placeholder="Es. Petto, Schiena, Gambe..."
          />
        </div>

        <section>
          <p className="mb-2 text-sm font-semibold">Volume e carico</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumField label="Serie" value={ex.sets} onChange={(v) => set("sets", v)} />
            <div>
              <Label className="text-xs">Ripetizioni</Label>
              <Input value={ex.reps ?? ""} onChange={(e) => set("reps", e.target.value)} placeholder="8-10" />
            </div>
            <NumField label="Rip. min" value={ex.repRangeMin} onChange={(v) => set("repRangeMin", v)} />
            <NumField label="Rip. max" value={ex.repRangeMax} onChange={(v) => set("repRangeMax", v)} />
            <NumField label="Carico" value={ex.loadKg} onChange={(v) => set("loadKg", v)} step="0.5" suffix="kg" />
            <NumField label="% 1RM" value={ex.percent1RM} onChange={(v) => set("percent1RM", v)} suffix="%" />
            <NumField label="RPE" value={ex.rpe} onChange={(v) => set("rpe", v)} step="0.5" />
            <NumField label="RIR" value={ex.rir} onChange={(v) => set("rir", v)} step="0.5" />
            <NumField label="Recupero" value={ex.restSeconds} onChange={(v) => set("restSeconds", v)} suffix="sec" />
            <NumField label="Priorità" value={ex.priority} onChange={(v) => set("priority", v)} />
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold">Tempo di esecuzione</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumField label="Eccentrica" value={ex.tempoEccentric} onChange={(v) => set("tempoEccentric", v)} suffix="s" />
            <NumField label="Pausa bassa" value={ex.tempoPauseBottom} onChange={(v) => set("tempoPauseBottom", v)} suffix="s" />
            <NumField label="Concentrica" value={ex.tempoConcentric} onChange={(v) => set("tempoConcentric", v)} suffix="s" />
            <NumField label="Pausa alta" value={ex.tempoPauseTop} onChange={(v) => set("tempoPauseTop", v)} suffix="s" />
            <NumField label="Tempo esecuzione" value={ex.executionTimeSeconds} onChange={(v) => set("executionTimeSeconds", v)} suffix="s" />
            <NumField label="Time under tension" value={ex.timeUnderTensionSeconds} onChange={(v) => set("timeUnderTensionSeconds", v)} suffix="s" />
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold">Tecniche di intensità</p>
          <div className="flex flex-wrap gap-2">
            <Toggle label="Drop set" checked={ex.isDropset} onChange={(v) => set("isDropset", v)} />
            <Toggle label="Rest-pause" checked={ex.isRestPause} onChange={(v) => set("isRestPause", v)} />
            <Toggle label="Superserie" checked={ex.isSuperset} onChange={(v) => set("isSuperset", v)} />
            <Toggle label="Giant set" checked={ex.isGiantSet} onChange={(v) => set("isGiantSet", v)} />
            <Toggle label="Circuito" checked={ex.isCircuit} onChange={(v) => set("isCircuit", v)} />
            <Toggle label="Serie di avvicinamento" checked={ex.isWarmupSet} onChange={(v) => set("isWarmupSet", v)} />
            <Toggle label="AMRAP" checked={ex.isAmrap} onChange={(v) => set("isAmrap", v)} />
            <Toggle label="EMOM" checked={ex.isEmom} onChange={(v) => set("isEmom", v)} />
            <Toggle label="A cedimento" checked={ex.toFailure} onChange={(v) => set("toFailure", v)} />
          </div>
          {(ex.isSuperset || ex.isGiantSet) && (
            <div className="mt-3">
              <Label className="text-xs">Gruppo superserie</Label>
              <Input
                value={ex.supersetGroup ?? ""}
                onChange={(e) => set("supersetGroup", e.target.value)}
                placeholder="Es. A1, A2..."
              />
            </div>
          )}
          {ex.isCircuit && (
            <div className="mt-3">
              <Label className="text-xs">Gruppo circuito</Label>
              <Input
                value={ex.circuitGroup ?? ""}
                onChange={(e) => set("circuitGroup", e.target.value)}
                placeholder="Es. Circuito 1"
              />
            </div>
          )}
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold">Note e materiale</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Intensità prevista</Label>
              <Input
                value={ex.intensityLabel ?? ""}
                onChange={(e) => set("intensityLabel", e.target.value)}
                placeholder="Es. Moderata, Alta..."
              />
            </div>
            <div>
              <Label className="text-xs">Note tecniche (per l&apos;allievo)</Label>
              <Textarea value={ex.technicalNotes ?? ""} onChange={(e) => set("technicalNotes", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Note del PT (private)</Label>
              <Textarea value={ex.coachNotes ?? ""} onChange={(e) => set("coachNotes", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Video (URL)</Label>
                <Input value={ex.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <div>
                <Label className="text-xs">Immagine (URL)</Label>
                <Input value={ex.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Link esterno</Label>
              <Input value={ex.externalLink ?? ""} onChange={(e) => set("externalLink", e.target.value)} />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button
            type="button"
            disabled={!ex.customName.trim()}
            onClick={() => {
              onSave(ex);
              onClose();
            }}
          >
            Salva esercizio
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
