import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });

  if (!user) {
    return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error: `Questo account usa l'accesso con ${user.oauthProvider ?? "un provider esterno"}, non una password. Usa il pulsante di accesso social.`,
      },
      { status: 401 }
    );
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "Questo account è stato disabilitato. Contatta l'assistenza." },
      { status: 403 }
    );
  }

  const token = await createSessionToken({ userId: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, profile: user.profile },
  });
}
