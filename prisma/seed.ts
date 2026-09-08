import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXERCISES: Array<{ name: string; muscleGroup: string }> = [
  { name: "Panca piana con bilanciere", muscleGroup: "Petto" },
  { name: "Panca inclinata con manubri", muscleGroup: "Petto" },
  { name: "Croci ai cavi", muscleGroup: "Petto" },
  { name: "Chest press", muscleGroup: "Petto" },
  { name: "Trazioni alla sbarra", muscleGroup: "Schiena" },
  { name: "Lat machine", muscleGroup: "Schiena" },
  { name: "Rematore con bilanciere", muscleGroup: "Schiena" },
  { name: "Pulley basso", muscleGroup: "Schiena" },
  { name: "Stacco da terra", muscleGroup: "Schiena" },
  { name: "Squat con bilanciere", muscleGroup: "Gambe" },
  { name: "Leg press", muscleGroup: "Gambe" },
  { name: "Affondi con manubri", muscleGroup: "Gambe" },
  { name: "Leg extension", muscleGroup: "Gambe" },
  { name: "Leg curl", muscleGroup: "Gambe" },
  { name: "Hip thrust", muscleGroup: "Gambe" },
  { name: "Calf raise in piedi", muscleGroup: "Gambe" },
  { name: "Military press con bilanciere", muscleGroup: "Spalle" },
  { name: "Alzate laterali con manubri", muscleGroup: "Spalle" },
  { name: "Alzate posteriori", muscleGroup: "Spalle" },
  { name: "Arnold press", muscleGroup: "Spalle" },
  { name: "Curl con bilanciere", muscleGroup: "Bicipiti" },
  { name: "Curl a martello", muscleGroup: "Bicipiti" },
  { name: "French press", muscleGroup: "Tricipiti" },
  { name: "Push down ai cavi", muscleGroup: "Tricipiti" },
  { name: "Plank", muscleGroup: "Core" },
  { name: "Crunch", muscleGroup: "Core" },
  { name: "Russian twist", muscleGroup: "Core" },
  { name: "Sollevamento gambe", muscleGroup: "Core" },
  { name: "Corsa", muscleGroup: "Cardio" },
  { name: "Cyclette", muscleGroup: "Cardio" },
];

async function main() {
  for (const ex of EXERCISES) {
    const existing = await prisma.exercise.findFirst({ where: { name: ex.name, isGlobal: true } });
    if (!existing) {
      await prisma.exercise.create({ data: { ...ex, isGlobal: true } });
    }
  }
  console.log(`Seeded ${EXERCISES.length} global exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
