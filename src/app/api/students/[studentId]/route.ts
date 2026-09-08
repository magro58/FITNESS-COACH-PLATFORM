import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTrainerOwnsStudent } from "@/lib/relationships";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const trainer = await requireRole("TRAINER");
    const { studentId } = await params;

    try {
      await assertTrainerOwnsStudent(trainer.id, studentId);
    } catch {
      return NextResponse.json({ error: "Allievo non trovato" }, { status: 404 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });
    if (!student) return NextResponse.json({ error: "Allievo non trovato" }, { status: 404 });

    const [plans, recentSessions, personalRecords, measurements, activity] = await Promise.all([
      prisma.workoutPlan.findMany({
        where: { studentId, trainerId: trainer.id },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.workoutSession.findMany({
        where: { studentId },
        orderBy: { startedAt: "desc" },
        take: 10,
        include: { day: true, plan: true },
      }),
      prisma.personalRecord.findMany({
        where: { studentId },
        orderBy: { achievedAt: "desc" },
        take: 10,
      }),
      prisma.bodyMeasurement.findMany({
        where: { studentId },
        orderBy: { recordedAt: "desc" },
        take: 10,
      }),
      prisma.activityEvent.findMany({
        where: { trainerId: trainer.id, studentId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      student: { id: student.id, email: student.email, profile: student.profile },
      plans,
      recentSessions,
      personalRecords,
      measurements,
      activity,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
