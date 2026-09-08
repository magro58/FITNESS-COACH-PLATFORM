import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trainer = await requireRole("TRAINER");

    const relations = await prisma.trainerStudent.findMany({
      where: { trainerId: trainer.id, status: "ACTIVE" },
      include: { student: { select: { id: true, profile: true } } },
    });
    const studentIds = relations.map((r) => r.studentId);

    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000);

    const [activeStudentIds, recentCompletions, newRecords, recentlyModifiedPlans, timeline] =
      await Promise.all([
        prisma.workoutSession.findMany({
          where: { studentId: { in: studentIds }, status: "COMPLETED", completedAt: { gte: fourteenDaysAgo } },
          select: { studentId: true },
          distinct: ["studentId"],
        }),
        prisma.workoutSession.findMany({
          where: { studentId: { in: studentIds }, status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 5,
          include: { student: { select: { id: true, profile: true } }, day: true },
        }),
        prisma.personalRecord.findMany({
          where: { studentId: { in: studentIds }, achievedAt: { gte: sevenDaysAgo } },
          orderBy: { achievedAt: "desc" },
          take: 5,
          include: { student: { select: { id: true, profile: true } } },
        }),
        prisma.workoutPlan.findMany({
          where: { trainerId: trainer.id, isTemplate: false },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: { student: { select: { id: true, profile: true } } },
        }),
        prisma.activityEvent.findMany({
          where: { trainerId: trainer.id },
          orderBy: { createdAt: "desc" },
          take: 15,
          include: { student: { select: { id: true, profile: true } } },
        }),
      ]);

    // Students who have an active plan but no completed session in the last 10 days.
    const studentsWithActivePlan = await prisma.workoutPlan.findMany({
      where: { trainerId: trainer.id, status: "ACTIVE", studentId: { in: studentIds } },
      select: { studentId: true },
    });
    const activePlanStudentIds = new Set(studentsWithActivePlan.map((p) => p.studentId).filter(Boolean));
    const recentSessionStudentIds = new Set(
      (
        await prisma.workoutSession.findMany({
          where: { studentId: { in: studentIds }, status: "COMPLETED", completedAt: { gte: tenDaysAgo } },
          select: { studentId: true },
          distinct: ["studentId"],
        })
      ).map((s) => s.studentId)
    );
    const needsAttentionIds = [...activePlanStudentIds].filter((id) => id && !recentSessionStudentIds.has(id));
    const needsAttention = relations
      .filter((r) => needsAttentionIds.includes(r.studentId))
      .map((r) => ({ studentId: r.studentId, profile: r.student.profile }));

    return NextResponse.json({
      totalStudents: relations.length,
      activeStudents: activeStudentIds.length,
      recentCompletions,
      newRecords,
      recentlyModifiedPlans,
      needsAttention,
      timeline,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
