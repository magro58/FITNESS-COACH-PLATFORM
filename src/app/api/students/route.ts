import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trainer = await requireRole("TRAINER");

    const relations = await prisma.trainerStudent.findMany({
      where: { trainerId: trainer.id, status: "ACTIVE" },
      include: { student: { select: { id: true, email: true, profile: true } } },
      orderBy: { createdAt: "desc" },
    });

    const students = await Promise.all(
      relations.map(async (rel) => {
        const [lastSession, activePlan, recentPR, weekAgoSessions] = await Promise.all([
          prisma.workoutSession.findFirst({
            where: { studentId: rel.studentId, status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
          }),
          prisma.workoutPlan.findFirst({
            where: { studentId: rel.studentId, status: "ACTIVE" },
            orderBy: { updatedAt: "desc" },
          }),
          prisma.personalRecord.findFirst({
            where: { studentId: rel.studentId, achievedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
            orderBy: { achievedAt: "desc" },
          }),
          prisma.workoutSession.count({
            where: {
              studentId: rel.studentId,
              status: "COMPLETED",
              completedAt: { gte: new Date(Date.now() - 7 * 86400000) },
            },
          }),
        ]);

        return {
          studentId: rel.studentId,
          linkedAt: rel.createdAt,
          email: rel.student.email,
          profile: rel.student.profile,
          lastSessionAt: lastSession?.completedAt ?? null,
          activePlanName: activePlan?.name ?? null,
          hasRecentPR: !!recentPR,
          sessionsLast7Days: weekAgoSessions,
        };
      })
    );

    return NextResponse.json({ students });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
