import { prisma } from "@/lib/prisma";

/** Epley formula: a widely used estimated-1RM approximation. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 100) / 100;
}

/**
 * Records a new PersonalRecord row when the given set beats the athlete's
 * current best estimated-1RM for that exercise name. Returns the created
 * record, or null when it isn't a new PR.
 */
export async function maybeRecordPersonalRecord(params: {
  studentId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  sourceSetLogId: string;
}) {
  const { studentId, exerciseName, weightKg, reps, sourceSetLogId } = params;
  if (!weightKg || !reps) return null;

  const e1rm = estimate1RM(weightKg, reps);

  const best = await prisma.personalRecord.findFirst({
    where: { studentId, exerciseName },
    orderBy: { estimated1RM: "desc" },
  });

  if (best && best.estimated1RM >= e1rm) return null;

  return prisma.personalRecord.create({
    data: {
      studentId,
      exerciseName,
      weightKg,
      reps,
      estimated1RM: e1rm,
      sourceSetLogId,
    },
  });
}
