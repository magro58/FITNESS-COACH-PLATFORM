import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const student = await requireRole("STUDENT");
    const plans = await prisma.workoutPlan.findMany({
      where: { studentId: student.id },
      include: { trainer: { select: { id: true, profile: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ plans });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
