import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminUpdateUserSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        studentsAsTrainer: { include: { student: { select: { email: true, profile: true } } } },
        trainerAsStudent: { include: { trainer: { select: { email: true, profile: true } } } },
      },
    });
    if (!user) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

    const [plansCount, sessionsCount, ticketsCount] = await Promise.all([
      user.role === "TRAINER"
        ? prisma.workoutPlan.count({ where: { trainerId: user.id } })
        : Promise.resolve(0),
      user.role === "STUDENT"
        ? prisma.workoutSession.count({ where: { studentId: user.id, status: "COMPLETED" } })
        : Promise.resolve(0),
      prisma.supportTicket.count({ where: { authorId: user.id } }),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        oauthProvider: user.oauthProvider,
        createdAt: user.createdAt,
        profile: user.profile,
        studentsCount: user.studentsAsTrainer.filter((r) => r.status === "ACTIVE").length,
        linkedTrainer:
          user.trainerAsStudent?.status === "ACTIVE" ? user.trainerAsStudent.trainer : null,
        plansCount,
        sessionsCount,
        ticketsCount,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;

    if (userId === admin.id) {
      return NextResponse.json({ error: "Non puoi disabilitare il tuo stesso account" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = adminUpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: parsed.data.isActive },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        oauthProvider: true,
        createdAt: true,
        profile: true,
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;

    if (userId === admin.id) {
      return NextResponse.json({ error: "Non puoi eliminare il tuo stesso account" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
