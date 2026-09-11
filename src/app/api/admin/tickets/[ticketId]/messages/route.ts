import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { ticketMessageSchema } from "@/lib/validation";
import { replyToTicketAsAdmin } from "@/lib/support";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { ticketId } = await params;

    const body = await req.json().catch(() => null);
    const parsed = ticketMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }

    const message = await replyToTicketAsAdmin({
      ticketId,
      adminId: admin.id,
      body: parsed.data.body,
    });

    if (!message) {
      return NextResponse.json({ error: "Ticket non trovato" }, { status: 404 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
