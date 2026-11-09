"use client";

import { useEffect, useRef, useState } from "react";
import { Input, Select } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { MUSCLE_GROUPS, EQUIPMENT_TIERS, muscleGroupLabel } from "@/lib/exercise-taxonomy";

interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
  equipmentTier: string | null;
  role: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
}

export function ExercisePicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (option: { id?: string; name: string; muscleGroup?: string; videoUrl?: string; imageUrl?: string }) => void;
}) {
  const [query, setQuery] = useState(value);
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipmentTier, setEquipmentTier] = useState("");
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams({ query });
      if (muscleGroup) params.set("muscleGroup", muscleGroup);
      if (equipmentTier) params.set("equipmentTier", equipmentTier);
      fetch(`/api/exercises?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => setOptions(d.exercises ?? []));
    }, 200);
    return () => clearTimeout(t);
  }, [query, muscleGroup, equipmentTier, open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onSelect({ name: e.target.value });
          setOpen(true);
        }}
        placeholder="Cerca o digita il nome dell'esercizio..."
      />
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <div className="flex gap-2 border-b border-border p-2">
            <Select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="h-8 flex-1 text-xs"
            >
              <option value="">Tutti i gruppi</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
            <Select
              value={equipmentTier}
              onChange={(e) => setEquipmentTier(e.target.value)}
              className="h-8 flex-1 text-xs"
            >
              <option value="">Qualsiasi attrezzatura</option>
              {EQUIPMENT_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {options.length === 0 && (
              <p className="px-3 py-3 text-xs text-muted-foreground">Nessun esercizio trovato.</p>
            )}
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setQuery(opt.name);
                  onSelect({
                    id: opt.id,
                    name: opt.name,
                    muscleGroup: opt.muscleGroup,
                    videoUrl: opt.videoUrl ?? undefined,
                    imageUrl: opt.imageUrl ?? undefined,
                  });
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                )}
              >
                <span className="truncate">{opt.name}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {opt.role === "MAIN" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Main
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{muscleGroupLabel(opt.muscleGroup)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
