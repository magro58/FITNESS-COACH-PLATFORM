import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validation";
import { isValidAvatarConfig } from "@/lib/avatar";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }

    const { displayName, bio, useAvatar, avatarConfig } = parsed.data;

    if (avatarConfig && !isValidAvatarConfig(avatarConfig)) {
      return NextResponse.json({ error: "Configurazione avatar non valida" }, { status: 400 });
    }

    const updated = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        displayName,
        bio: bio ?? null,
        ...(useAvatar !== undefined ? { useAvatar } : {}),
        ...(avatarConfig ? { avatarConfig } : {}),
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
