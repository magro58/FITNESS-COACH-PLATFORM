import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, deleteFile, ALLOWED_IMAGE_MIME, MAX_UPLOAD_BYTES } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const isDirectUpload = (req.headers.get("content-type") ?? "").includes("application/json");

    let key: string;

    if (isDirectUpload) {
      // File already uploaded straight to Vercel Blob by the browser (see
      // src/lib/upload-client.ts) — we only received a reference to it.
      const body = await req.json().catch(() => null);
      const directKey = typeof body?.key === "string" ? body.key : null;
      const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
      if (!directKey || !directKey.startsWith(`photos/${user.id}/`)) {
        return NextResponse.json({ error: "Upload non valido" }, { status: 400 });
      }
      if (!ALLOWED_IMAGE_MIME.has(mimeType)) {
        return NextResponse.json({ error: "Formato immagine non supportato" }, { status: 400 });
      }
      key = directKey;
    } else {
      const form = await req.formData();
      const file = form.get("photo");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
      }
      if (!ALLOWED_IMAGE_MIME.has(file.type)) {
        return NextResponse.json({ error: "Formato immagine non supportato" }, { status: 400 });
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "File troppo grande" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      key = (await saveFile(`photos/${user.id}`, buffer, file.type)).key;
    }

    const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (existing?.photoUrl) {
      await deleteFile(existing.photoUrl).catch(() => undefined);
    }

    const updated = await prisma.profile.update({
      where: { userId: user.id },
      data: { photoUrl: key, useAvatar: false },
    });

    return NextResponse.json({ profile: updated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (existing?.photoUrl) {
      await deleteFile(existing.photoUrl).catch(() => undefined);
    }
    const updated = await prisma.profile.update({
      where: { userId: user.id },
      data: { photoUrl: null, useAvatar: true },
    });
    return NextResponse.json({ profile: updated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
