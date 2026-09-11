import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const [trainers, students, admins, disabledUsers, openTickets, inProgressTickets, totalTickets] =
      await Promise.all([
        prisma.user.count({ where: { role: "TRAINER" } }),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.supportTicket.count({ where: { status: "OPEN" } }),
        prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
        prisma.supportTicket.count(),
      ]);

    return NextResponse.json({
      trainers,
      students,
      admins,
      disabledUsers,
      openTickets,
      inProgressTickets,
      totalTickets,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
