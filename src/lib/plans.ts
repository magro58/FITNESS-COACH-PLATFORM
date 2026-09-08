import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import type { planDaySchema } from "@/lib/validation";

type DayInput = z.infer<typeof planDaySchema>;

/** Creates a new PlanVersion (with its days/exercises) for a plan and returns it. */
export async function createPlanVersion(params: {
  planId: string;
  versionNumber: number;
  createdById: string;
  note?: string | null;
  days: DayInput[];
}) {
  return prisma.planVersion.create({
    data: {
      planId: params.planId,
      versionNumber: params.versionNumber,
      note: params.note ?? null,
      createdById: params.createdById,
      days: {
        create: params.days.map((day, dayIndex) => ({
          name: day.name,
          orderIndex: day.orderIndex ?? dayIndex,
          notes: day.notes ?? null,
          exercises: {
            create: day.exercises.map((ex, exIndex) => ({
              exerciseId: ex.exerciseId ?? null,
              customName: ex.customName,
              muscleGroup: ex.muscleGroup ?? null,
              orderIndex: ex.orderIndex ?? exIndex,
              sets: ex.sets ?? null,
              reps: ex.reps ?? null,
              repRangeMin: ex.repRangeMin ?? null,
              repRangeMax: ex.repRangeMax ?? null,
              loadKg: ex.loadKg ?? null,
              percent1RM: ex.percent1RM ?? null,
              rpe: ex.rpe ?? null,
              rir: ex.rir ?? null,
              restSeconds: ex.restSeconds ?? null,
              tempoEccentric: ex.tempoEccentric ?? null,
              tempoPauseBottom: ex.tempoPauseBottom ?? null,
              tempoConcentric: ex.tempoConcentric ?? null,
              tempoPauseTop: ex.tempoPauseTop ?? null,
              executionTimeSeconds: ex.executionTimeSeconds ?? null,
              timeUnderTensionSeconds: ex.timeUnderTensionSeconds ?? null,
              isDropset: ex.isDropset ?? false,
              isRestPause: ex.isRestPause ?? false,
              isSuperset: ex.isSuperset ?? false,
              isGiantSet: ex.isGiantSet ?? false,
              isCircuit: ex.isCircuit ?? false,
              isWarmupSet: ex.isWarmupSet ?? false,
              isAmrap: ex.isAmrap ?? false,
              isEmom: ex.isEmom ?? false,
              toFailure: ex.toFailure ?? false,
              supersetGroup: ex.supersetGroup ?? null,
              circuitGroup: ex.circuitGroup ?? null,
              priority: ex.priority ?? null,
              intensityLabel: ex.intensityLabel ?? null,
              technicalNotes: ex.technicalNotes ?? null,
              coachNotes: ex.coachNotes ?? null,
              videoUrl: ex.videoUrl ?? null,
              imageUrl: ex.imageUrl ?? null,
              externalLink: ex.externalLink ?? null,
            })),
          },
        })),
      },
    },
    include: { days: { include: { exercises: true }, orderBy: { orderIndex: "asc" } } },
  });
}

/** Produces a short human-readable diff summary between two versions' exercise sets. */
export function computeChangeSummary(
  oldDays: Array<{ name: string; exercises: Array<{ customName: string; sets: number | null; reps: string | null; loadKg: number | null }> }>,
  newDays: DayInput[]
): string {
  const oldNames = new Set(oldDays.flatMap((d) => d.exercises.map((e) => e.customName.toLowerCase())));
  const newNames = new Set(newDays.flatMap((d) => d.exercises.map((e) => e.customName.toLowerCase())));

  const added = [...newNames].filter((n) => !oldNames.has(n));
  const removed = [...oldNames].filter((n) => !newNames.has(n));

  const oldDayCount = oldDays.length;
  const newDayCount = newDays.length;

  const parts: string[] = [];
  if (newDayCount !== oldDayCount) {
    parts.push(`giornate: ${oldDayCount} → ${newDayCount}`);
  }
  if (added.length) parts.push(`${added.length} esercizi aggiunti`);
  if (removed.length) parts.push(`${removed.length} esercizi rimossi`);

  // Detect parameter changes on exercises present in both versions.
  let changedParams = 0;
  const oldByName = new Map(oldDays.flatMap((d) => d.exercises.map((e) => [e.customName.toLowerCase(), e] as const)));
  for (const day of newDays) {
    for (const ex of day.exercises) {
      const prev = oldByName.get(ex.customName.toLowerCase());
      if (prev && (prev.sets !== (ex.sets ?? null) || prev.reps !== (ex.reps ?? null) || prev.loadKg !== (ex.loadKg ?? null))) {
        changedParams++;
      }
    }
  }
  if (changedParams > 0) parts.push(`${changedParams} esercizi con parametri modificati`);

  if (parts.length === 0) return "Modifiche minori alla scheda";
  return parts.join(", ");
}
