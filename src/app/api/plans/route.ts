import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planSaveSchema } from "@/lib/validation";
import { createPlanVersion } from "@/lib/plans";
import { assertTrainerOwnsStudent } from "@/lib/relationships";
import { notify } from "@/lib/notifications";
import { logActivity } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const trainer = await requireRole("TRAINER");
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const isTemplate = searchParams.get("isTemplate");

    const plans = await prisma.workoutPlan.findMany({
      where: {
        trainerId: trainer.id,
        ...(studentId ? { studentId } : {}),
        ...(isTemplate === "true" ? { isTemplate: true } : {}),
      },
      include: { student: { select: { id: true, profile: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ plans });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const trainer = await requireRole("TRAINER");
    const body = await req.json().catch(() => null);
    const parsed = planSaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.studentId) {
      try {
        await assertTrainerOwnsStudent(trainer.id, data.studentId);
      } catch {
        return NextResponse.json({ error: "Allievo non valido" }, { status: 403 });
      }
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        trainerId: trainer.id,
        studentId: data.studentId ?? null,
        name: data.name,
        description: data.description ?? null,
        goal: data.goal ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes ?? null,
        isTemplate: data.isTemplate ?? false,
        status: data.studentId ? "ACTIVE" : "DRAFT",
        assignedAt: data.studentId ? new Date() : null,
        currentVersionNumber: 1,
      },
    });

    const version = await createPlanVersion({
      planId: plan.id,
      versionNumber: 1,
      createdById: trainer.id,
      note: "Versione iniziale",
      days: data.days,
    });

    if (data.studentId) {
      await notify({
        userId: data.studentId,
        type: "PLAN_ASSIGNED",
        title: `Ti è stata assegnata una nuova scheda: ${plan.name}`,
        body: data.goal ?? undefined,
        resourceType: "plan",
        resourceId: plan.id,
      });
      await logActivity({
        trainerId: trainer.id,
        studentId: data.studentId,
        type: "PLAN_ASSIGNED",
        message: `Hai assegnato la scheda "${plan.name}"`,
      });
    }

    return NextResponse.json({ plan: { ...plan, versions: [version] } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
