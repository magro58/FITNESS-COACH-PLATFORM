"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SortableExerciseRow } from "./SortableExerciseRow";
import { ExerciseEditorDialog } from "./ExerciseEditorDialog";
import { emptyExercise, clientId, type BuilderDay, type BuilderExercise } from "@/lib/plan-builder-types";

export function DayEditor({
  day,
  onChange,
}: {
  day: BuilderDay;
  onChange: (day: BuilderDay) => void;
}) {
  const [editing, setEditing] = useState<BuilderExercise | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function updateExercises(exercises: BuilderExercise[]) {
    onChange({ ...day, exercises });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = day.exercises.findIndex((e) => e.clientId === active.id);
    const newIndex = day.exercises.findIndex((e) => e.clientId === over.id);
    updateExercises(arrayMove(day.exercises, oldIndex, newIndex));
  }

  function addExercise() {
    setEditing(emptyExercise());
  }

  function saveExercise(ex: BuilderExercise) {
    const exists = day.exercises.some((e) => e.clientId === ex.clientId);
    if (exists) {
      updateExercises(day.exercises.map((e) => (e.clientId === ex.clientId ? ex : e)));
    } else {
      updateExercises([...day.exercises, ex]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Nome giornata</Label>
          <Input value={day.name} onChange={(e) => onChange({ ...day, name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Note giornata</Label>
          <Textarea
            value={day.notes}
            onChange={(e) => onChange({ ...day, notes: e.target.value })}
            className="min-h-[42px]"
          />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={day.exercises.map((e) => e.clientId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {day.exercises.map((ex) => (
              <SortableExerciseRow
                key={ex.clientId}
                exercise={ex}
                onEdit={() => setEditing(ex)}
                onDuplicate={() =>
                  updateExercises([
                    ...day.exercises,
                    { ...ex, clientId: clientId("ex"), id: undefined },
                  ])
                }
                onDelete={() => updateExercises(day.exercises.filter((e) => e.clientId !== ex.clientId))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {day.exercises.length === 0 && (
        <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Nessun esercizio in questa giornata.
        </p>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addExercise}>
        <Plus size={15} /> Aggiungi esercizio
      </Button>

      {editing && (
        <ExerciseEditorDialog
          open={!!editing}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={saveExercise}
        />
      )}
    </div>
  );
}
