import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTicketSchema } from "@/lib/validation";
import { createTicket } from "@/lib/support";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Non disponibile per gli admin" }, { status: 403 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Non disponibile per gli admin" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dati non validi" },
        { status: 400 }
      );
    }

    const ticket = await createTicket({
      authorId: user.id,
      authorName: user.profile?.displayName ?? user.email,
      subject: parsed.data.subject,
      category: parsed.data.category,
      message: parsed.data.message,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
