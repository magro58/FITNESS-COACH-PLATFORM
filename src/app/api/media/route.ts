import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  saveFile,
  ALLOWED_IMAGE_MIME,
  ALLOWED_VIDEO_MIME,
  MAX_UPLOAD_BYTES,
} from "@/lib/storage";
import { notify, logActivity } from "@/lib/notifications";
import { assertTrainerOwnsStudent } from "@/lib/relationships";
import type { MediaContext } from "@prisma/client";

const VALID_CONTEXTS = new Set(["EXERCISE", "SESSION", "PHYSICAL_UPDATE", "GENERAL", "PLAN"]);

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const box = searchParams.get("box") ?? "all"; // received | sent | all
    const withUserId = searchParams.get("withUserId");

    const media = await prisma.media.findMany({
      where: {
        AND: [
          box === "received" ? { recipientId: user.id } : box === "sent" ? { uploaderId: user.id } : { OR: [{ uploaderId: user.id }, { recipientId: user.id }] },
          withUserId ? { OR: [{ uploaderId: withUserId }, { recipientId: withUserId }] } : {},
        ],
      },
      include: {
        uploader: { select: { id: true, profile: true } },
        recipient: { select: { id: true, profile: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ media });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const isDirectUpload = (req.headers.get("content-type") ?? "").includes("application/json");

    let file: File | null = null;
    let directKey: string | null = null;
    let directSizeBytes = 0;
    let mimeType: string;
    let context: string;
    let note: string | null;
    let recipientIdRaw: string | null;
    let relatedExerciseLogId: string | null;
    let relatedPlanExerciseId: string | null;
    let relatedSessionId: string | null;
    let relatedPlanId: string | null;

    if (isDirectUpload) {
      // File already uploaded straight to Vercel Blob by the browser (see
      // src/lib/upload-client.ts) — we only received a reference to it.
      const body = await req.json().catch(() => null);
      directKey = typeof body?.key === "string" ? body.key : null;
      directSizeBytes = typeof body?.sizeBytes === "number" ? body.sizeBytes : 0;
      mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
      context = String(body?.context ?? "GENERAL");
      note = body?.note ? String(body.note) : null;
      recipientIdRaw = body?.recipientId ? String(body.recipientId) : null;
      relatedExerciseLogId = body?.relatedExerciseLogId ? String(body.relatedExerciseLogId) : null;
      relatedPlanExerciseId = body?.relatedPlanExerciseId ? String(body.relatedPlanExerciseId) : null;
      relatedSessionId = body?.relatedSessionId ? String(body.relatedSessionId) : null;
      relatedPlanId = body?.relatedPlanId ? String(body.relatedPlanId) : null;

      if (!directKey || !directKey.startsWith(`media/${user.id}/`)) {
        return NextResponse.json({ error: "Upload non valido" }, { status: 400 });
      }
    } else {
      const form = await req.formData();
      const f = form.get("file");
      if (!(f instanceof File)) {
        return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
      }
      file = f;
      mimeType = f.type;
      context = String(form.get("context") ?? "GENERAL");
      note = form.get("note") ? String(form.get("note")) : null;
      recipientIdRaw = form.get("recipientId") ? String(form.get("recipientId")) : null;
      relatedExerciseLogId = form.get("relatedExerciseLogId") ? String(form.get("relatedExerciseLogId")) : null;
      relatedPlanExerciseId = form.get("relatedPlanExerciseId") ? String(form.get("relatedPlanExerciseId")) : null;
      relatedSessionId = form.get("relatedSessionId") ? String(form.get("relatedSessionId")) : null;
      relatedPlanId = form.get("relatedPlanId") ? String(form.get("relatedPlanId")) : null;
    }

    if (!VALID_CONTEXTS.has(context)) {
      return NextResponse.json({ error: "Contesto non valido" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_MIME.has(mimeType);
    const isVideo = ALLOWED_VIDEO_MIME.has(mimeType);
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Formato file non supportato" }, { status: 400 });
    }
    if (file && file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File troppo grande" }, { status: 400 });
    }
    if (directKey && directSizeBytes > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File troppo grande" }, { status: 400 });
    }

    let recipientId: string;
    if (user.role === "STUDENT") {
      const relation = await prisma.trainerStudent.findUnique({ where: { studentId: user.id } });
      if (!relation || relation.status !== "ACTIVE") {
        return NextResponse.json({ error: "Nessun Personal Trainer collegato" }, { status: 400 });
      }
      recipientId = relation.trainerId;
    } else {
      if (!recipientIdRaw) {
        return NextResponse.json({ error: "Seleziona un allievo destinatario" }, { status: 400 });
      }
      try {
        await assertTrainerOwnsStudent(user.id, recipientIdRaw);
      } catch {
        return NextResponse.json({ error: "Allievo non valido" }, { status: 403 });
      }
      recipientId = recipientIdRaw;
    }

    let key: string;
    let sizeBytes: number;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      ({ key, sizeBytes } = await saveFile(`media/${user.id}`, buffer, mimeType));
    } else {
      key = directKey!;
      sizeBytes = directSizeBytes;
    }

    const media = await prisma.media.create({
      data: {
        uploaderId: user.id,
        recipientId,
        type: isImage ? "IMAGE" : "VIDEO",
        url: key,
        mimeType,
        sizeBytes,
        context: context as MediaContext,
        note,
        relatedExerciseLogId,
        relatedPlanExerciseId,
        relatedSessionId,
        relatedPlanId,
      },
    });

    const senderName = user.profile?.displayName ?? "Un utente";
    await notify({
      userId: recipientId,
      type: "MEDIA_RECEIVED",
      title: `${senderName} ti ha inviato ${isVideo ? "un video" : "una foto"}`,
      body: note ?? undefined,
      resourceType: "media",
      resourceId: media.id,
    });

    if (user.role === "STUDENT") {
      await logActivity({
        trainerId: recipientId,
        studentId: user.id,
        type: "MEDIA_RECEIVED",
        message: `Ha inviato ${isVideo ? "un video" : "una foto"}${note ? `: ${note}` : ""}`,
      });
    }

    return NextResponse.json({ media });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
