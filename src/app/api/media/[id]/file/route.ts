import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return NextResponse.json({ error: "Media non trovato" }, { status: 404 });

    const allowed = media.uploaderId === user.id || media.recipientId === user.id;
    if (!allowed) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

    const buffer = await readFile(media.url);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": media.mimeType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
