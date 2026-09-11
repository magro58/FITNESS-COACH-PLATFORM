import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TicketStatus } from "@prisma/client";

const VALID_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "CLOSED"];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const statusParam = req.nextUrl.searchParams.get("status");
    const status =
      statusParam && VALID_STATUSES.includes(statusParam as TicketStatus)
        ? (statusParam as TicketStatus)
        : undefined;

    const tickets = await prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, email: true, role: true, profile: true } },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
