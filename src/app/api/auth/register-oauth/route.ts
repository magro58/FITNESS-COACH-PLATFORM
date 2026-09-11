import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { completeOAuthSchema } from "@/lib/validation";
import {
  createSessionToken,
  setSessionCookie,
  getPendingOAuthIdentity,
  clearPendingOAuthCookie,
} from "@/lib/auth";
import { defaultAvatarConfig } from "@/lib/avatar";
import { applyInviteCode } from "@/lib/registration";

export async function POST(req: NextRequest) {
  const pending = await getPendingOAuthIdentity();
  if (!pending) {
    return NextResponse.json(
      { error: "Sessione di accesso scaduta. Riprova ad accedere con il provider scelto." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = completeOAuthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }
  const { role, inviteCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: pending.email } });
  if (existing) {
    // Someone else (or a concurrent tab) already finished this registration.
    await clearPendingOAuthCookie();
    return NextResponse.json({ error: "Questo account esiste già, effettua il login" }, { status: 409 });
  }

  if (role === "STUDENT" && inviteCode) {
    const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Codice invito non valido o scaduto" }, { status: 400 });
    }
  }

  const user = await prisma.user.create({
    data: {
      email: pending.email,
      passwordHash: null,
      oauthProvider: pending.provider,
      role,
      profile: {
        create: {
          displayName: pending.name,
          avatarConfig: defaultAvatarConfig(pending.email),
          useAvatar: true,
        },
      },
    },
    include: { profile: true },
  });

  if (role === "STUDENT" && inviteCode) {
    await applyInviteCode(inviteCode, user.id, pending.name);
  }

  const token = await createSessionToken({ userId: user.id, role: user.role });
  await setSessionCookie(token);
  await clearPendingOAuthCookie();

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, profile: user.profile },
  });
}
