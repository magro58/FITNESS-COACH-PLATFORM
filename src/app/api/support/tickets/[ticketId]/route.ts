import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const user = await requireUser();
    const { ticketId } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, role: true, profile: true } } },
        },
      },
    });

    if (!ticket || ticket.authorId !== user.id) {
      return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
