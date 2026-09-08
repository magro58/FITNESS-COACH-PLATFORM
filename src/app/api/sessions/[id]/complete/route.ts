import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify, logActivity } from "@/lib/notifications";
import { fatigueSchema } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({
  notes: z.string().trim().optional().nullable(),
  fatigueSurvey: fatigueSchema.optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const student = await requireRole("STUDENT");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);

    const session = await prisma.workoutSession.findUnique({
      where: { id },
      include: { day: true, plan: true, exerciseLogs: { include: { setLogs: true } } },
    });
    if (!session || session.studentId !== student.id) {
      return NextResponse.json({ error: "Sessione non trovata" }, { status: 404 });
    }
    if (session.status === "COMPLETED") {
      return NextResponse.json({ session });
    }

    const completedAt = new Date();
    const durationSeconds = Math.max(
      1,
      Math.round((completedAt.getTime() - session.startedAt.getTime()) / 1000)
    );

    const updated = await prisma.workoutSession.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt,
        durationSeconds,
        notes: parsed.success ? parsed.data.notes ?? null : null,
      },
    });

    if (parsed.success && parsed.data.fatigueSurvey) {
      const survey = parsed.data.fatigueSurvey;
      const hasAnyValue = Object.values(survey).some((v) => v !== null && v !== undefined && v !== "");
      if (hasAnyValue) {
        await prisma.fatigueRecoveryEntry.create({
          data: { studentId: student.id, ...survey },
        });
      }
    }

    const relation = await prisma.trainerStudent.findUnique({ where: { studentId: student.id } });
    if (relation) {
      const totalSets = session.exerciseLogs.reduce(
        (sum, log) => sum + log.setLogs.filter((s) => s.completed).length,
        0
      );
      await notify({
        userId: relation.trainerId,
        type: "WORKOUT_COMPLETED",
        title: `${student.profile?.displayName ?? "L'allievo"} ha completato "${session.day?.name ?? session.plan?.name ?? "un allenamento"}"`,
        body: `${totalSets} serie completate`,
        resourceType: "student",
        resourceId: student.id,
      });
      await logActivity({
        trainerId: relation.trainerId,
        studentId: student.id,
        type: "WORKOUT_COMPLETED",
        message: `Ha completato "${session.day?.name ?? session.plan?.name ?? "un allenamento"}"`,
      });
    }

    return NextResponse.json({ session: updated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
