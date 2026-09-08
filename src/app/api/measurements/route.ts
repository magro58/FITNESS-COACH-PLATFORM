import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { measurementSchema } from "@/lib/validation";
import { notify, logActivity } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const student = await requireRole("STUDENT");
    const measurements = await prisma.bodyMeasurement.findMany({
      where: { studentId: student.id },
      orderBy: { recordedAt: "desc" },
      take: 60,
    });
    return NextResponse.json({ measurements });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const student = await requireRole("STUDENT");
    const body = await req.json().catch(() => null);
    const parsed = measurementSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

    const measurement = await prisma.bodyMeasurement.create({
      data: { studentId: student.id, ...parsed.data },
    });

    const relation = await prisma.trainerStudent.findUnique({ where: { studentId: student.id } });
    if (relation) {
      await notify({
        userId: relation.trainerId,
        type: "NEW_MEASUREMENT",
        title: `${student.profile?.displayName ?? "L'allievo"} ha registrato una nuova misurazione`,
        body: parsed.data.weightKg ? `Peso: ${parsed.data.weightKg}kg` : undefined,
        resourceType: "student",
        resourceId: student.id,
      });
      await logActivity({
        trainerId: relation.trainerId,
        studentId: student.id,
        type: "NEW_MEASUREMENT",
        message: "Ha registrato un nuovo aggiornamento fisico",
      });
    }

    return NextResponse.json({ measurement });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
