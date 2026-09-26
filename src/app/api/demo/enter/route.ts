import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { resetDemoData } from "@/lib/demo";

const schema = z.object({ role: z.enum(["TRAINER", "STUDENT"]) });

// Public, unauthenticated by design — this is the entire point of the demo.
// resetDemoData() wipes and reseeds the fixed demo accounts on every call
// (rate-limited internally to once per ~5s) so every visitor gets a clean,
// realistic dataset regardless of what a previous visitor did.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 });
  }

  const { trainerId, studentId } = await resetDemoData();
  const userId = parsed.data.role === "TRAINER" ? trainerId : studentId;

  const token = await createSessionToken({ userId, role: parsed.data.role });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
