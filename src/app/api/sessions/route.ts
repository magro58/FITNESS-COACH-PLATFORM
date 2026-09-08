import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ dayId: z.string().min(1) });

export async function GET(req: NextRequest) {
  try {
    const student = await requireRole("STUDENT");
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);
    const status = searchParams.get("status");

    const sessions = await prisma.workoutSession.findMany({
      where: { studentId: student.id, ...(status ? { status: status as never } : {}) },
      orderBy: { startedAt: "desc" },
      take: limit,
      include: { day: true, plan: true },
    });
    return NextResponse.json({ sessions });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const student = await requireRole("STUDENT");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Giornata richiesta" }, { status: 400 });

    const day = await prisma.planDay.findUnique({
      where: { id: parsed.data.dayId },
      include: {
        exercises: { orderBy: { orderIndex: "asc" } },
        version: { include: { plan: true } },
      },
    });
    if (!day || day.version.plan.studentId !== student.id) {
      return NextResponse.json({ error: "Giornata non trovata" }, { status: 404 });
    }

    const existing = await prisma.workoutSession.findFirst({
      where: { studentId: student.id, dayId: day.id, status: "IN_PROGRESS" },
    });
    if (existing) {
      return NextResponse.json({ session: existing, resumed: true });
    }

    const session = await prisma.workoutSession.create({
      data: {
        studentId: student.id,
        planId: day.version.plan.id,
        planVersionId: day.versionId,
        dayId: day.id,
        status: "IN_PROGRESS",
        exerciseLogs: {
          create: day.exercises.map((ex, idx) => ({
            planExerciseId: ex.id,
            exerciseName: ex.customName,
            muscleGroup: ex.muscleGroup,
            orderIndex: idx,
            setLogs: {
              create: Array.from({ length: Math.max(ex.sets ?? 3, 1) }, (_, i) => ({
                setNumber: i + 1,
                completed: false,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({ session, resumed: false });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
