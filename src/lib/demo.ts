import { prisma } from "@/lib/prisma";
import { defaultAvatarConfig } from "@/lib/avatar";
import type { Prisma } from "@prisma/client";

// Powers the public /demo experience (see /demo, /api/demo/enter). Two
// fixed accounts (isDemo: true, no password, unreachable via normal
// login) that anyone can enter without registering — their data is wiped
// and reseeded with a realistic dataset every time someone enters, so the
// demo always looks fresh regardless of what a previous visitor did.

export const DEMO_TRAINER_EMAIL = "demo-trainer@fitnesscoachplatform.demo";
export const DEMO_STUDENT_EMAIL = "demo-student@fitnesscoachplatform.demo";

const MIN_RESET_INTERVAL_MS = 5000;

async function ensureDemoAccounts() {
  let trainer = await prisma.user.findUnique({ where: { email: DEMO_TRAINER_EMAIL } });
  if (!trainer) {
    trainer = await prisma.user.create({
      data: {
        email: DEMO_TRAINER_EMAIL,
        role: "TRAINER",
        isDemo: true,
        passwordHash: null,
        profile: {
          create: {
            displayName: "Marco Rossi",
            bio: "Personal Trainer — account demo pubblico.",
            avatarConfig: defaultAvatarConfig(DEMO_TRAINER_EMAIL),
            useAvatar: true,
          },
        },
      },
    });
  }

  let student = await prisma.user.findUnique({ where: { email: DEMO_STUDENT_EMAIL } });
  if (!student) {
    student = await prisma.user.create({
      data: {
        email: DEMO_STUDENT_EMAIL,
        role: "STUDENT",
        isDemo: true,
        passwordHash: null,
        profile: {
          create: {
            displayName: "Giulia Bianchi",
            bio: "Allieva — account demo pubblico.",
            avatarConfig: defaultAvatarConfig(DEMO_STUDENT_EMAIL),
            useAvatar: true,
          },
        },
      },
    });
  }

  const link = await prisma.trainerStudent.findUnique({ where: { studentId: student.id } });
  if (!link) {
    await prisma.trainerStudent.create({ data: { trainerId: trainer.id, studentId: student.id } });
  } else if (link.trainerId !== trainer.id || link.status !== "ACTIVE") {
    await prisma.trainerStudent.update({
      where: { studentId: student.id },
      data: { trainerId: trainer.id, status: "ACTIVE" },
    });
  }

  return { trainer, student };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function epley1RM(weightKg: number, reps: number): number {
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

const UPPER_EXERCISES = [
  { name: "Panca piana con bilanciere", muscleGroup: "Petto", base: 60, sets: 4, reps: 8 },
  { name: "Trazioni alla sbarra", muscleGroup: "Schiena", base: 0, sets: 3, reps: 8 },
  { name: "Military press con bilanciere", muscleGroup: "Spalle", base: 40, sets: 3, reps: 8 },
  { name: "Curl con bilanciere", muscleGroup: "Bicipiti", base: 30, sets: 3, reps: 10 },
];

const LOWER_EXERCISES = [
  { name: "Squat con bilanciere", muscleGroup: "Gambe", base: 80, sets: 4, reps: 6 },
  { name: "Stacco da terra", muscleGroup: "Schiena", base: 100, sets: 3, reps: 5 },
  { name: "Leg press", muscleGroup: "Gambe", base: 140, sets: 3, reps: 10 },
  { name: "Plank", muscleGroup: "Core", base: 0, sets: 3, reps: 60 },
];

async function wipeDemoData(trainerId: string, studentId: string) {
  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { userId: { in: [trainerId, studentId] } } }),
    prisma.activityEvent.deleteMany({ where: { trainerId, studentId } }),
    prisma.personalRecord.deleteMany({ where: { studentId } }),
    prisma.bodyMeasurement.deleteMany({ where: { studentId } }),
    prisma.fatigueRecoveryEntry.deleteMany({ where: { studentId } }),
    prisma.workoutSession.deleteMany({ where: { studentId } }),
    prisma.workoutPlan.deleteMany({ where: { trainerId, studentId } }),
  ]);
}

export async function resetDemoData(): Promise<{ trainerId: string; studentId: string }> {
  const { trainer, student } = await ensureDemoAccounts();

  const recentlyReset =
    trainer.lastDemoResetAt && Date.now() - trainer.lastDemoResetAt.getTime() < MIN_RESET_INTERVAL_MS;
  if (recentlyReset) {
    return { trainerId: trainer.id, studentId: student.id };
  }

  await wipeDemoData(trainer.id, student.id);

  const plan = await prisma.workoutPlan.create({
    data: {
      trainerId: trainer.id,
      studentId: student.id,
      name: "Forza e ipertrofia — 4 settimane",
      description: "Scheda dimostrativa full-body su 2 giorni, con sovraccarico progressivo.",
      goal: "Forza",
      status: "ACTIVE",
      startDate: daysAgo(28),
      assignedAt: daysAgo(28),
      currentVersionNumber: 1,
      versions: {
        create: {
          versionNumber: 1,
          note: "Versione iniziale",
          createdById: trainer.id,
          days: {
            create: [
              {
                name: "Giorno A — Upper Body",
                orderIndex: 0,
                exercises: {
                  create: UPPER_EXERCISES.map((ex, i) => ({
                    customName: ex.name,
                    muscleGroup: ex.muscleGroup,
                    orderIndex: i,
                    sets: ex.sets,
                    reps: `${ex.reps}`,
                    loadKg: ex.base || null,
                    rpe: 8,
                    restSeconds: 90,
                  })),
                },
              },
              {
                name: "Giorno B — Lower Body",
                orderIndex: 1,
                exercises: {
                  create: LOWER_EXERCISES.map((ex, i) => ({
                    customName: ex.name,
                    muscleGroup: ex.muscleGroup,
                    orderIndex: i,
                    sets: ex.sets,
                    reps: `${ex.reps}`,
                    loadKg: ex.base || null,
                    rpe: 8,
                    restSeconds: ex.name === "Plank" ? 45 : 120,
                  })),
                },
              },
            ],
          },
        },
      },
    },
    include: { versions: { include: { days: { include: { exercises: true } } } } },
  });

  const version = plan.versions[0];
  const dayA = version.days.find((d) => d.name.startsWith("Giorno A"))!;
  const dayB = version.days.find((d) => d.name.startsWith("Giorno B"))!;

  // 6 completed sessions over the past ~4 weeks, alternating A/B, with
  // light progressive overload so analytics charts show a real trend.
  const sessionPlan = [
    { day: dayA, exercises: UPPER_EXERCISES, offset: 0, daysAgoVal: 25 },
    { day: dayB, exercises: LOWER_EXERCISES, offset: 0, daysAgoVal: 21 },
    { day: dayA, exercises: UPPER_EXERCISES, offset: 1, daysAgoVal: 17 },
    { day: dayB, exercises: LOWER_EXERCISES, offset: 1, daysAgoVal: 13 },
    { day: dayA, exercises: UPPER_EXERCISES, offset: 2, daysAgoVal: 6 },
    { day: dayB, exercises: LOWER_EXERCISES, offset: 2, daysAgoVal: 2 },
  ];

  let bestBench: { weightKg: number; reps: number; setLogId: string } | null = null;
  let bestSquat: { weightKg: number; reps: number; setLogId: string } | null = null;
  let bestDeadlift: { weightKg: number; reps: number; setLogId: string } | null = null;

  for (const s of sessionPlan) {
    const completedAt = daysAgo(s.daysAgoVal);
    const session = await prisma.workoutSession.create({
      data: {
        studentId: student.id,
        planId: plan.id,
        planVersionId: version.id,
        dayId: s.day.id,
        status: "COMPLETED",
        startedAt: completedAt,
        completedAt,
        durationSeconds: 3600 + s.offset * 120,
      },
    });

    for (const [exIndex, ex] of s.exercises.entries()) {
      const planExercise = s.day.exercises.find((pe) => pe.customName === ex.name)!;
      const exerciseLog = await prisma.exerciseLog.create({
        data: {
          sessionId: session.id,
          planExerciseId: planExercise.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          orderIndex: exIndex,
          completedAt,
        },
      });

      const weightKg = ex.base ? ex.base + s.offset * 2.5 : null;
      const setLogsData = Array.from({ length: ex.sets }).map((_, setIndex) => ({
        exerciseLogId: exerciseLog.id,
        setNumber: setIndex + 1,
        weightKg,
        reps: ex.reps,
        rpe: 7 + Math.min(setIndex, 2) * 0.5,
        completed: true,
        createdAt: completedAt,
      }));

      const created = await Promise.all(
        setLogsData.map((data) => prisma.setLog.create({ data }))
      );

      if (weightKg && isBestSession(s.offset)) {
        const lastSet = created[created.length - 1];
        const entry = { weightKg, reps: ex.reps, setLogId: lastSet.id };
        if (ex.name === "Panca piana con bilanciere") bestBench = entry;
        if (ex.name === "Squat con bilanciere") bestSquat = entry;
        if (ex.name === "Stacco da terra") bestDeadlift = entry;
      }
    }
  }

  const prEntries: Prisma.PersonalRecordCreateManyInput[] = [];
  for (const [name, best] of [
    ["Panca piana con bilanciere", bestBench],
    ["Squat con bilanciere", bestSquat],
    ["Stacco da terra", bestDeadlift],
  ] as const) {
    if (!best) continue;
    prEntries.push({
      studentId: student.id,
      exerciseName: name,
      weightKg: best.weightKg,
      reps: best.reps,
      estimated1RM: epley1RM(best.weightKg, best.reps),
      sourceSetLogId: best.setLogId,
      achievedAt: daysAgo(2),
    });
  }
  if (prEntries.length) {
    await prisma.personalRecord.createMany({ data: prEntries });
  }

  await prisma.bodyMeasurement.createMany({
    data: [28, 21, 14, 7, 2].map((d, i) => ({
      studentId: student.id,
      weightKg: 78 - i * 0.6,
      bodyFatPct: 18 - i * 0.4,
      chestCm: 102,
      waistCm: 86 - i * 0.5,
      hipsCm: 98,
      armCm: 36 + i * 0.1,
      thighCm: 58,
      recordedAt: daysAgo(d),
    })),
  });

  await prisma.fatigueRecoveryEntry.createMany({
    data: [25, 21, 17, 13, 6, 2].map((d) => ({
      studentId: student.id,
      fatigue: 5,
      energy: 7,
      recovery: 7,
      sleepQuality: 7,
      stress: 4,
      doms: 4,
      recordedAt: daysAgo(d),
    })),
  });

  await prisma.activityEvent.createMany({
    data: [
      {
        trainerId: trainer.id,
        studentId: student.id,
        type: "WORKOUT_COMPLETED",
        message: "Ha completato Giorno B — Lower Body",
        createdAt: daysAgo(2),
      },
      {
        trainerId: trainer.id,
        studentId: student.id,
        type: "NEW_PERSONAL_RECORD",
        message: "Nuovo record: Squat con bilanciere",
        createdAt: daysAgo(2),
      },
      {
        trainerId: trainer.id,
        studentId: student.id,
        type: "NEW_MEASUREMENT",
        message: "Ha registrato nuove misurazioni corporee",
        createdAt: daysAgo(2),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: trainer.id,
        type: "WORKOUT_COMPLETED",
        title: "Giulia ha completato l'allenamento",
        body: "Giorno B — Lower Body",
        read: false,
        createdAt: daysAgo(2),
      },
      {
        userId: trainer.id,
        type: "NEW_PERSONAL_RECORD",
        title: "Nuovo record personale di Giulia",
        body: "Squat con bilanciere",
        read: false,
        createdAt: daysAgo(2),
      },
      {
        userId: student.id,
        type: "PLAN_ASSIGNED",
        title: "Marco ti ha assegnato una scheda",
        body: "Forza e ipertrofia — 4 settimane",
        read: true,
        createdAt: daysAgo(28),
      },
    ],
  });

  await prisma.user.updateMany({
    where: { id: { in: [trainer.id, student.id] } },
    data: { lastDemoResetAt: new Date() },
  });

  return { trainerId: trainer.id, studentId: student.id };
}

// Only the last session's top set of each showcase lift should count toward
// a PersonalRecord — this identifies that final (offset 2) session.
function isBestSession(offset: number): boolean {
  return offset === 2;
}
