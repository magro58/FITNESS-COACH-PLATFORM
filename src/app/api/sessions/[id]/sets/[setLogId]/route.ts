import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maybeRecordPersonalRecord } from "@/lib/training";
import { notify, logActivity } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({
  weightKg: z.number().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  rpe: z.number().nullable().optional(),
  rir: z.number().nullable().optional(),
  completed: z.boolean().optional(),
  toFailure: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  restTakenSeconds: z.number().int().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setLogId: string }> }
) {
  try {
    const student = await requireRole("STUDENT");
    const { id, setLogId } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

    const setLog = await prisma.setLog.findUnique({
      where: { id: setLogId },
      include: { exerciseLog: { include: { session: true } } },
    });
    if (!setLog || setLog.exerciseLog.sessionId !== id || setLog.exerciseLog.session.studentId !== student.id) {
      return NextResponse.json({ error: "Serie non trovata" }, { status: 404 });
    }

    const updated = await prisma.setLog.update({
      where: { id: setLogId },
      data: parsed.data,
    });

    let newPR = null;
    if (updated.completed && updated.weightKg && updated.reps) {
      newPR = await maybeRecordPersonalRecord({
        studentId: student.id,
        exerciseName: setLog.exerciseLog.exerciseName,
        weightKg: updated.weightKg,
        reps: updated.reps,
        sourceSetLogId: updated.id,
      });

      if (newPR) {
        const relation = await prisma.trainerStudent.findUnique({ where: { studentId: student.id } });
        if (relation) {
          await notify({
            userId: relation.trainerId,
            type: "NEW_PERSONAL_RECORD",
            title: `${student.profile?.displayName ?? "L'allievo"} ha stabilito un nuovo record su ${setLog.exerciseLog.exerciseName}`,
            body: `${updated.weightKg}kg × ${updated.reps} ripetizioni`,
            resourceType: "student",
            resourceId: student.id,
          });
          await logActivity({
            trainerId: relation.trainerId,
            studentId: student.id,
            type: "NEW_PERSONAL_RECORD",
            message: `Nuovo record: ${setLog.exerciseLog.exerciseName} ${updated.weightKg}kg × ${updated.reps}`,
          });
        }
      }
    }

    return NextResponse.json({ setLog: updated, newPR });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
