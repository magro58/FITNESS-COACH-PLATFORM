import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketStatusSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await requireAdmin();
    const { ticketId } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        author: { select: { id: true, email: true, role: true, profile: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, role: true, profile: true } } },
        },
      },
    });

    if (!ticket) return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });

    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await requireAdmin();
    const { ticketId } = await params;

    const body = await req.json().catch(() => null);
    const parsed = ticketStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }

    const existing = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!existing) return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: parsed.data.status },
    });

    if (existing.status !== ticket.status) {
      await notify({
        userId: ticket.authorId,
        type: "SUPPORT_TICKET_STATUS",
        title: `Ticket aggiornato: ${ticket.subject}`,
        body: `Stato: ${statusLabel(ticket.status)}`,
        resourceType: "ticket",
        resourceId: ticket.id,
      });
    }

    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Aperto";
    case "IN_PROGRESS":
      return "In lavorazione";
    case "CLOSED":
      return "Chiuso";
    default:
      return status;
  }
}
