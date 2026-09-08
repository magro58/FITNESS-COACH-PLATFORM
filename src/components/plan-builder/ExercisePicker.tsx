"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
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
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      fetch(`/api/exercises?query=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setOptions(d.exercises ?? []));
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

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
      {open && options.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
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
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
              )}
            >
              <span>{opt.name}</span>
              <span className="text-xs text-muted-foreground">{opt.muscleGroup}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
