import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify, logActivity } from "@/lib/notifications";
import { assertTrainerOwnsStudent } from "@/lib/relationships";
import { z } from "zod";

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const schema = z.object({
  recipientId: z.string().min(1),
  url: z.string().trim().refine(isSafeHttpUrl, "Deve essere un URL http/https valido"),
  title: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
  relatedPlanExerciseId: z.string().optional().nullable(),
  relatedPlanId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const box = searchParams.get("box") ?? "all";

    const links = await prisma.link.findMany({
      where:
        box === "received"
          ? { recipientId: user.id }
          : box === "sent"
            ? { senderId: user.id }
            : { OR: [{ senderId: user.id }, { recipientId: user.id }] },
      include: {
        sender: { select: { id: true, profile: true } },
        recipient: { select: { id: true, profile: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ links });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const trainer = await requireRole("TRAINER");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }

    try {
      await assertTrainerOwnsStudent(trainer.id, parsed.data.recipientId);
    } catch {
      return NextResponse.json({ error: "Allievo non valido" }, { status: 403 });
    }

    const link = await prisma.link.create({
      data: {
        senderId: trainer.id,
        recipientId: parsed.data.recipientId,
        url: parsed.data.url,
        title: parsed.data.title ?? null,
        note: parsed.data.note ?? null,
        relatedPlanExerciseId: parsed.data.relatedPlanExerciseId ?? null,
        relatedPlanId: parsed.data.relatedPlanId ?? null,
      },
    });

    await notify({
      userId: parsed.data.recipientId,
      type: "LINK_RECEIVED",
      title: `${trainer.profile?.displayName ?? "Il tuo PT"} ti ha inviato un link`,
      body: parsed.data.title ?? parsed.data.url,
      resourceType: "link",
      resourceId: link.id,
    });
    await logActivity({
      trainerId: trainer.id,
      studentId: parsed.data.recipientId,
      type: "LINK_SENT",
      message: `Hai inviato un link${parsed.data.title ? `: ${parsed.data.title}` : ""}`,
    });

    return NextResponse.json({ link });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
