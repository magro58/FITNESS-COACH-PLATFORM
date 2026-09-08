import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const student = await requireRole("STUDENT");

    const activePlan = await prisma.workoutPlan.findFirst({
      where: { studentId: student.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { days: { orderBy: { orderIndex: "asc" }, include: { exercises: true } } },
        },
      },
    });

    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

    const [lastSession, sessionsThisWeek, recentPRs, unreadNotifications] = await Promise.all([
      prisma.workoutSession.findFirst({
        where: { studentId: student.id, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        include: { day: true },
      }),
      prisma.workoutSession.count({
        where: { studentId: student.id, status: "COMPLETED", completedAt: { gte: startOfWeek } },
      }),
      prisma.personalRecord.findMany({
        where: { studentId: student.id },
        orderBy: { achievedAt: "desc" },
        take: 3,
      }),
      prisma.notification.count({ where: { userId: student.id, read: false } }),
    ]);

    return NextResponse.json({
      activePlan,
      lastSession,
      sessionsThisWeek,
      recentPRs,
      unreadNotifications,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
