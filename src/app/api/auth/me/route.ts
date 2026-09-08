import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  let linkedTrainer = null;
  const linkedStudent = null;
  if (user.role === "STUDENT") {
    const rel = await prisma.trainerStudent.findUnique({
      where: { studentId: user.id },
      include: { trainer: { select: { id: true, profile: true } } },
    });
    if (rel && rel.status === "ACTIVE") {
      linkedTrainer = { id: rel.trainer.id, profile: rel.trainer.profile };
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      linkedTrainer,
      linkedStudent,
    },
  });
}
