import { NextResponse } from "next/server";
import { getSession, createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  const adminId = typeof session?.impersonatedBy === "string" ? session.impersonatedBy : null;
  if (!adminId) {
    return NextResponse.json({ error: "Non stai visualizzando l'app come un altro utente" }, { status: 400 });
  }

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== "ADMIN" || !admin.isActive) {
    return NextResponse.json({ error: "Account admin non più valido" }, { status: 403 });
  }

  const token = await createSessionToken({ userId: admin.id, role: admin.role });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
