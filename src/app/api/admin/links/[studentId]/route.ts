import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlinkStudent } from "@/lib/relationships";
import { notify } from "@/lib/notifications";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    await requireAdmin();
    const { studentId } = await params;

    const [trainer, student] = await Promise.all([
      prisma.trainerStudent
        .findUnique({ where: { studentId } })
        .then((rel) =>
          rel?.status === "ACTIVE"
            ? prisma.user.findUnique({ where: { id: rel.trainerId }, include: { profile: true } })
            : null
        ),
      prisma.user.findUnique({ where: { id: studentId }, include: { profile: true } }),
    ]);

    const removed = await unlinkStudent(studentId);
    if (!removed) {
      return NextResponse.json({ error: "Nessun collegamento attivo da rimuovere" }, { status: 404 });
    }

    await Promise.all([
      trainer &&
        notify({
          userId: trainer.id,
          type: "GENERAL_MESSAGE",
          title: `Collegamento rimosso con ${student?.profile?.displayName ?? student?.email ?? "un allievo"}`,
          body: "Rimosso dall'assistenza.",
        }),
      notify({
        userId: studentId,
        type: "GENERAL_MESSAGE",
        title: `Collegamento con ${trainer?.profile?.displayName ?? trainer?.email ?? "il tuo PT"} rimosso`,
        body: "Rimosso dall'assistenza.",
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
