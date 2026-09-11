import { NextResponse } from "next/server";
import { requireAdmin, AuthError, createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Non puoi accedere come un altro admin" }, { status: 400 });
    }
    if (!target.isActive) {
      return NextResponse.json({ error: "Questo account è disabilitato" }, { status: 400 });
    }

    const token = await createSessionToken({
      userId: target.id,
      role: target.role,
      impersonatedBy: admin.id,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, role: target.role });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
