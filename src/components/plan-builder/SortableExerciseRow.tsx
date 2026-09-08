"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Copy, Trash2, Flame, Repeat, Timer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BuilderExercise } from "@/lib/plan-builder-types";
import { cn } from "@/lib/cn";

export function SortableExerciseRow({
  exercise,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  exercise: BuilderExercise;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.clientId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const techniques = [
    exercise.isSuperset && "Superserie",
    exercise.isCircuit && "Circuito",
    exercise.isDropset && "Drop set",
    exercise.isRestPause && "Rest-pause",
    exercise.isGiantSet && "Giant set",
    exercise.isAmrap && "AMRAP",
    exercise.isEmom && "EMOM",
    exercise.toFailure && "Cedimento",
  ].filter(Boolean) as string[];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-md border border-border bg-card p-3 transition",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="mt-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Trascina per riordinare"
      >
        <GripVertical size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{exercise.customName || "Esercizio senza nome"}</p>
          {exercise.muscleGroup && (
            <Badge variant="outline">{exercise.muscleGroup}</Badge>
          )}
          {techniques.map((t) => (
            <Badge key={t} variant="accent">
              <Flame size={11} /> {t}
            </Badge>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {exercise.sets != null && (
            <span className="flex items-center gap-1">
              <Repeat size={12} /> {exercise.sets} × {exercise.reps ?? "-"}
            </span>
          )}
          {exercise.loadKg != null && <span>{exercise.loadKg} kg</span>}
          {exercise.rpe != null && <span>RPE {exercise.rpe}</span>}
          {exercise.rir != null && <span>RIR {exercise.rir}</span>}
          {exercise.restSeconds != null && (
            <span className="flex items-center gap-1">
              <Timer size={12} /> {exercise.restSeconds}s
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Modifica"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Duplica"
        >
          <Copy size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
          aria-label="Elimina"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
