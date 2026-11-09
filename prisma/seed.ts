import { PrismaClient } from "@prisma/client";
import exercises from "./data/exercises.json";

const prisma = new PrismaClient();

async function main() {
  // Global exercises are fully owned by the catalog (createdById is always
  // null for them) — safe to replace wholesale. Trainers' own custom
  // exercises (isGlobal: false) are untouched. Deleting still-referenced
  // rows just detaches old plans from the catalog (PlanExercise.exerciseId
  // → SetNull); their copied customName/muscleGroup keep displaying fine.
  await prisma.exercise.deleteMany({ where: { isGlobal: true } });
  await prisma.exercise.createMany({
    data: exercises.map((ex) => ({ ...ex, isGlobal: true })),
  });
  console.log(`Seeded ${exercises.length} global exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
