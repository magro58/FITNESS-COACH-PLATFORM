import { prisma } from "@/lib/prisma";

/** Whether two users are linked via an active trainer/student relationship (in either direction). */
export async function areLinked(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return true;
  const rel = await prisma.trainerStudent.findFirst({
    where: {
      status: "ACTIVE",
      OR: [
        { trainerId: userIdA, studentId: userIdB },
        { trainerId: userIdB, studentId: userIdA },
      ],
    },
  });
  return !!rel;
}

/** Returns the active trainer/student link row for a student, or null. */
export async function getActiveRelationForStudent(studentId: string) {
  return prisma.trainerStudent.findUnique({
    where: { studentId },
  });
}

/** Throws if `trainerId` does not have an active relationship with `studentId`. */
export async function assertTrainerOwnsStudent(trainerId: string, studentId: string) {
  const rel = await prisma.trainerStudent.findUnique({ where: { studentId } });
  if (!rel || rel.trainerId !== trainerId || rel.status !== "ACTIVE") {
    throw new Error("FORBIDDEN");
  }
  return rel;
}
