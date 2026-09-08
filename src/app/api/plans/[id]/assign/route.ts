import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTrainerOwnsStudent } from "@/lib/relationships";
import { notify, logActivity } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({ studentId: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const trainer = await requireRole("TRAINER");
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Allievo richiesto" }, { status: 400 });

    const plan = await prisma.workoutPlan.findUnique({ where: { id } });
    if (!plan || plan.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Scheda non trovata" }, { status: 404 });
    }

    try {
      await assertTrainerOwnsStudent(trainer.id, parsed.data.studentId);
    } catch {
      return NextResponse.json({ error: "Allievo non valido" }, { status: 403 });
    }

    const updated = await prisma.workoutPlan.update({
      where: { id },
      data: {
        studentId: parsed.data.studentId,
        status: "ACTIVE",
        assignedAt: new Date(),
        isTemplate: false,
      },
    });

    await notify({
      userId: parsed.data.studentId,
      type: "PLAN_ASSIGNED",
      title: `Ti è stata assegnata una nuova scheda: ${updated.name}`,
      body: updated.goal ?? undefined,
      resourceType: "plan",
      resourceId: updated.id,
    });
    await logActivity({
      trainerId: trainer.id,
      studentId: parsed.data.studentId,
      type: "PLAN_ASSIGNED",
      message: `Hai assegnato la scheda "${updated.name}"`,
    });

    return NextResponse.json({ plan: updated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
