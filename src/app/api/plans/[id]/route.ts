import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planSaveSchema } from "@/lib/validation";
import { createPlanVersion, computeChangeSummary } from "@/lib/plans";
import { notify, logActivity } from "@/lib/notifications";

async function loadPlanForViewer(planId: string, userId: string, role: string) {
  const plan = await prisma.workoutPlan.findUnique({
    where: { id: planId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { days: { orderBy: { orderIndex: "asc" }, include: { exercises: { orderBy: { orderIndex: "asc" } } } } },
      },
      student: { select: { id: true, profile: true } },
    },
  });
  if (!plan) return null;
  const allowed = role === "TRAINER" ? plan.trainerId === userId : plan.studentId === userId;
  if (!allowed) return null;
  return plan;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const plan = await loadPlanForViewer(id, user.id, user.role);
    if (!plan) return NextResponse.json({ error: "Scheda non trovata" }, { status: 404 });

    const versionHistory = await prisma.planVersion.findMany({
      where: { planId: id },
      orderBy: { versionNumber: "desc" },
      select: { id: true, versionNumber: true, note: true, createdAt: true },
    });
    const changelog = await prisma.planChangeLog.findMany({
      where: { planId: id },
      orderBy: { versionNumber: "desc" },
    });

    return NextResponse.json({ plan, versionHistory, changelog });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const trainer = await requireRole("TRAINER");
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = planSaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const plan = await prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { days: { include: { exercises: true } } },
        },
      },
    });
    if (!plan || plan.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Scheda non trovata" }, { status: 404 });
    }

    const isAssigned = !!plan.studentId;
    const currentVersion = plan.versions[0];

    let newVersionNumber = plan.currentVersionNumber;
    let changeSummary: string | null = null;

    if (isAssigned) {
      newVersionNumber = plan.currentVersionNumber + 1;
      changeSummary = computeChangeSummary(currentVersion?.days ?? [], data.days);
      await createPlanVersion({
        planId: plan.id,
        versionNumber: newVersionNumber,
        createdById: trainer.id,
        note: data.versionNote ?? changeSummary,
        days: data.days,
      });
    } else {
      // Not yet assigned: overwrite the draft in place, no version bump.
      if (currentVersion) {
        await prisma.planDay.deleteMany({ where: { versionId: currentVersion.id } });
        await prisma.planVersion.delete({ where: { id: currentVersion.id } });
      }
      await createPlanVersion({
        planId: plan.id,
        versionNumber: newVersionNumber,
        createdById: trainer.id,
        note: "Bozza",
        days: data.days,
      });
    }

    const updated = await prisma.workoutPlan.update({
      where: { id: plan.id },
      data: {
        name: data.name,
        description: data.description ?? null,
        goal: data.goal ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes ?? null,
        currentVersionNumber: newVersionNumber,
      },
    });

    if (isAssigned && plan.studentId) {
      await prisma.planChangeLog.create({
        data: {
          planId: plan.id,
          versionNumber: newVersionNumber,
          summary: changeSummary ?? "Scheda aggiornata",
        },
      });
      await notify({
        userId: plan.studentId,
        type: "PLAN_UPDATED",
        title: `La scheda "${updated.name}" è stata aggiornata`,
        body: changeSummary ?? undefined,
        resourceType: "plan",
        resourceId: plan.id,
      });
      await logActivity({
        trainerId: trainer.id,
        studentId: plan.studentId,
        type: "PLAN_UPDATED",
        message: `Hai modificato la scheda "${updated.name}" (v${newVersionNumber})`,
      });
    }

    return NextResponse.json({ plan: updated, versionNumber: newVersionNumber });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const trainer = await requireRole("TRAINER");
    const { id } = await params;
    const plan = await prisma.workoutPlan.findUnique({ where: { id } });
    if (!plan || plan.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Scheda non trovata" }, { status: 404 });
    }
    await prisma.workoutPlan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
