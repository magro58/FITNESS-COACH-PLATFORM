import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPlanVersion } from "@/lib/plans";
import { assertTrainerOwnsStudent } from "@/lib/relationships";
import { notify, logActivity } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({ studentId: z.string().optional().nullable() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const trainer = await requireRole("TRAINER");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    const targetStudentId = parsed.success ? parsed.data.studentId : null;

    const source = await prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { days: { orderBy: { orderIndex: "asc" }, include: { exercises: { orderBy: { orderIndex: "asc" } } } } },
        },
      },
    });
    if (!source || source.trainerId !== trainer.id) {
      return NextResponse.json({ error: "Scheda non trovata" }, { status: 404 });
    }

    if (targetStudentId) {
      try {
        await assertTrainerOwnsStudent(trainer.id, targetStudentId);
      } catch {
        return NextResponse.json({ error: "Allievo non valido" }, { status: 403 });
      }
    }

    const copy = await prisma.workoutPlan.create({
      data: {
        trainerId: trainer.id,
        studentId: targetStudentId ?? null,
        name: `${source.name} (copia)`,
        description: source.description,
        goal: source.goal,
        startDate: source.startDate,
        endDate: source.endDate,
        notes: source.notes,
        isTemplate: !targetStudentId && source.isTemplate,
        status: targetStudentId ? "ACTIVE" : "DRAFT",
        assignedAt: targetStudentId ? new Date() : null,
        currentVersionNumber: 1,
      },
    });

    const sourceDays = source.versions[0]?.days ?? [];
    await createPlanVersion({
      planId: copy.id,
      versionNumber: 1,
      createdById: trainer.id,
      note: `Duplicata da "${source.name}"`,
      days: sourceDays.map((day, dIdx) => ({
        name: day.name,
        orderIndex: day.orderIndex ?? dIdx,
        notes: day.notes,
        exercises: day.exercises.map((ex, eIdx) => ({
          exerciseId: ex.exerciseId,
          customName: ex.customName,
          muscleGroup: ex.muscleGroup,
          orderIndex: ex.orderIndex ?? eIdx,
          sets: ex.sets,
          reps: ex.reps,
          repRangeMin: ex.repRangeMin,
          repRangeMax: ex.repRangeMax,
          loadKg: ex.loadKg,
          percent1RM: ex.percent1RM,
          rpe: ex.rpe,
          rir: ex.rir,
          restSeconds: ex.restSeconds,
          tempoEccentric: ex.tempoEccentric,
          tempoPauseBottom: ex.tempoPauseBottom,
          tempoConcentric: ex.tempoConcentric,
          tempoPauseTop: ex.tempoPauseTop,
          executionTimeSeconds: ex.executionTimeSeconds,
          timeUnderTensionSeconds: ex.timeUnderTensionSeconds,
          isDropset: ex.isDropset,
          isRestPause: ex.isRestPause,
          isSuperset: ex.isSuperset,
          isGiantSet: ex.isGiantSet,
          isCircuit: ex.isCircuit,
          isWarmupSet: ex.isWarmupSet,
          isAmrap: ex.isAmrap,
          isEmom: ex.isEmom,
          toFailure: ex.toFailure,
          supersetGroup: ex.supersetGroup,
          circuitGroup: ex.circuitGroup,
          priority: ex.priority,
          intensityLabel: ex.intensityLabel,
          technicalNotes: ex.technicalNotes,
          coachNotes: ex.coachNotes,
          videoUrl: ex.videoUrl,
          imageUrl: ex.imageUrl,
          externalLink: ex.externalLink,
        })),
      })),
    });

    if (targetStudentId) {
      await notify({
        userId: targetStudentId,
        type: "PLAN_ASSIGNED",
        title: `Ti è stata assegnata una nuova scheda: ${copy.name}`,
        resourceType: "plan",
        resourceId: copy.id,
      });
      await logActivity({
        trainerId: trainer.id,
        studentId: targetStudentId,
        type: "PLAN_ASSIGNED",
        message: `Hai assegnato la scheda "${copy.name}"`,
      });
    }

    return NextResponse.json({ plan: copy });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
