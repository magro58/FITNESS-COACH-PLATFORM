import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode() {
  return nanoid(8)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, (c) => CODE_ALPHABET[c.charCodeAt(0) % CODE_ALPHABET.length]);
}

export async function POST() {
  try {
    const trainer = await requireRole("TRAINER");

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.inviteCode.create({
      data: { trainerId: trainer.id, code, expiresAt },
    });

    return NextResponse.json({ invite });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function GET() {
  try {
    const trainer = await requireRole("TRAINER");
    const invites = await prisma.inviteCode.findMany({
      where: { trainerId: trainer.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invites });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
