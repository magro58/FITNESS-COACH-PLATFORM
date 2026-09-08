import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({ code: z.string().trim().min(1) });

export async function POST(req: NextRequest) {
  try {
    const student = await requireRole("STUDENT");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Codice richiesto" }, { status: 400 });
    }

    const existingLink = await prisma.trainerStudent.findUnique({ where: { studentId: student.id } });
    if (existingLink && existingLink.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Sei già collegato a un Personal Trainer" },
        { status: 409 }
      );
    }

    const invite = await prisma.inviteCode.findUnique({
      where: { code: parsed.data.code.toUpperCase().trim() },
    });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Codice invito non valido o scaduto" }, { status: 400 });
    }

    const [relation] = await prisma.$transaction([
      existingLink
        ? prisma.trainerStudent.update({
            where: { studentId: student.id },
            data: { trainerId: invite.trainerId, status: "ACTIVE" },
          })
        : prisma.trainerStudent.create({
            data: { trainerId: invite.trainerId, studentId: student.id },
          }),
      prisma.inviteCode.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedById: student.id },
      }),
    ]);

    await notify({
      userId: invite.trainerId,
      type: "STUDENT_LINKED",
      title: `${student.profile?.displayName ?? "Un allievo"} si è collegato al tuo account`,
      body: "Nuovo allievo collegato tramite codice invito.",
      resourceType: "student",
      resourceId: student.id,
    });

    return NextResponse.json({ relation });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
