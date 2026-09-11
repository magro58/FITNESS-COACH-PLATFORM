import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

/**
 * Validates an invite code and, if valid, links the student to the
 * inviting trainer and notifies the trainer. Used by both the password
 * registration flow and the OAuth registration flow so the two stay in
 * sync.
 */
export async function applyInviteCode(
  inviteCode: string,
  studentId: string,
  studentDisplayName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { ok: false, error: "Codice invito non valido o scaduto" };
  }

  await prisma.$transaction([
    prisma.trainerStudent.create({
      data: { trainerId: invite.trainerId, studentId },
    }),
    prisma.inviteCode.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedById: studentId },
    }),
  ]);

  await notify({
    userId: invite.trainerId,
    type: "STUDENT_LINKED",
    title: `${studentDisplayName} si è collegato al tuo account`,
    body: "Nuovo allievo collegato tramite invito.",
    resourceType: "student",
    resourceId: studentId,
  });

  return { ok: true };
}
