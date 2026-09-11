import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminLinkSchema } from "@/lib/validation";
import { linkTrainerAndStudent } from "@/lib/relationships";
import { notify } from "@/lib/notifications";

export async function GET() {
  try {
    await requireAdmin();

    const [links, unlinkedStudents] = await Promise.all([
      prisma.trainerStudent.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          trainer: { select: { id: true, email: true, profile: true, isActive: true } },
          student: { select: { id: true, email: true, profile: true, isActive: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          isActive: true,
          OR: [{ trainerAsStudent: null }, { trainerAsStudent: { status: "REMOVED" } }],
        },
        select: { id: true, email: true, profile: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ links, unlinkedStudents });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => null);
    const parsed = adminLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }
    const { trainerId, studentId } = parsed.data;

    const [trainer, student] = await Promise.all([
      prisma.user.findUnique({ where: { id: trainerId }, include: { profile: true } }),
      prisma.user.findUnique({ where: { id: studentId }, include: { profile: true } }),
    ]);
    if (!trainer || trainer.role !== "TRAINER") {
      return NextResponse.json({ error: "Personal Trainer non valido" }, { status: 400 });
    }
    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Allievo non valido" }, { status: 400 });
    }

    const relation = await linkTrainerAndStudent(trainerId, studentId);

    await Promise.all([
      notify({
        userId: trainerId,
        type: "STUDENT_LINKED",
        title: `${student.profile?.displayName ?? student.email} è stato collegato al tuo account`,
        body: "Collegamento effettuato dall'assistenza.",
        resourceType: "student",
        resourceId: studentId,
      }),
      notify({
        userId: studentId,
        type: "GENERAL_MESSAGE",
        title: `Sei stato collegato a ${trainer.profile?.displayName ?? trainer.email}`,
        body: "Collegamento effettuato dall'assistenza.",
      }),
    ]);

    return NextResponse.json({ relation });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
