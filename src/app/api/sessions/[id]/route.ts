import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const session = await prisma.workoutSession.findUnique({
      where: { id },
      include: {
        day: true,
        plan: true,
        exerciseLogs: {
          orderBy: { orderIndex: "asc" },
          include: {
            setLogs: { orderBy: { setNumber: "asc" } },
            planExercise: true,
          },
        },
      },
    });
    if (!session) return NextResponse.json({ error: "Sessione non trovata" }, { status: 404 });

    const allowed =
      (user.role === "STUDENT" && session.studentId === user.id) ||
      (user.role === "TRAINER" && session.plan?.trainerId === user.id);
    if (!allowed) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

    const lastByExercise: Record<string, { weightKg: number | null; reps: number | null; recordedAt: string }[]> = {};
    for (const log of session.exerciseLogs) {
      const lastLog = await prisma.exerciseLog.findFirst({
        where: {
          sessionId: { not: session.id },
          exerciseName: log.exerciseName,
          session: { studentId: session.studentId, status: "COMPLETED" },
        },
        orderBy: { session: { completedAt: "desc" } },
        include: { setLogs: { where: { completed: true }, orderBy: { setNumber: "asc" } } },
      });
      if (lastLog) {
        lastByExercise[log.exerciseName] = lastLog.setLogs.map((s) => ({
          weightKg: s.weightKg,
          reps: s.reps,
          recordedAt: lastLog.completedAt?.toISOString() ?? "",
        }));
      }
    }

    return NextResponse.json({ session, lastByExercise });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
