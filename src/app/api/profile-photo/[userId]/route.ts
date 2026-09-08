import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "@/lib/storage";
import { areLinked } from "@/lib/relationships";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const requester = await requireUser();
    const { userId } = await params;

    const allowed = requester.id === userId || (await areLinked(requester.id, userId));
    if (!allowed) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile?.photoUrl) {
      return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
    }

    const buffer = await readFile(profile.photoUrl);
    const ext = profile.photoUrl.split(".").pop() ?? "";
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
