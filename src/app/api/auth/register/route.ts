import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { defaultAvatarConfig } from "@/lib/avatar";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
      { status: 400 }
    );
  }
  const { email, password, displayName, role, inviteCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email già registrata" }, { status: 409 });
  }

  let invite: Awaited<ReturnType<typeof prisma.inviteCode.findUnique>> = null;
  if (role === "STUDENT" && inviteCode) {
    invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Codice invito non valido o scaduto" }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      profile: {
        create: {
          displayName,
          avatarConfig: defaultAvatarConfig(email),
          useAvatar: true,
        },
      },
    },
    include: { profile: true },
  });

  if (invite) {
    await prisma.$transaction([
      prisma.trainerStudent.create({
        data: { trainerId: invite.trainerId, studentId: user.id },
      }),
      prisma.inviteCode.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedById: user.id },
      }),
    ]);
    await notify({
      userId: invite.trainerId,
      type: "STUDENT_LINKED",
      title: `${displayName} si è collegato al tuo account`,
      body: "Nuovo allievo collegato tramite invito.",
      resourceType: "student",
      resourceId: user.id,
    });
  }

  const token = await createSessionToken({ userId: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, profile: user.profile },
  });
}
