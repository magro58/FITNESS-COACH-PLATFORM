import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTrainerOwnsStudent } from "@/lib/relationships";
import { estimate1RM } from "@/lib/training";

function periodToDays(period: string | null): number | null {
  if (!period || period === "all") return null;
  const n = Number(period);
  return Number.isFinite(n) ? n : 90;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const user = await requireUser();
    const { studentId } = await params;

    if (user.role === "TRAINER") {
      try {
        await assertTrainerOwnsStudent(user.id, studentId);
      } catch {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
    } else if (user.id !== studentId) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = periodToDays(searchParams.get("period"));
    const exerciseFilter = searchParams.get("exercise");
    const muscleGroupFilter = searchParams.get("muscleGroup");

    const since = days ? new Date(Date.now() - days * 86400000) : new Date(0);
    const prevSince = days ? new Date(since.getTime() - days * 86400000) : new Date(0);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        studentId,
        status: "COMPLETED",
        completedAt: { gte: prevSince },
      },
      include: {
        day: true,
        exerciseLogs: {
          where: {
            ...(exerciseFilter ? { exerciseName: exerciseFilter } : {}),
            ...(muscleGroupFilter ? { muscleGroup: muscleGroupFilter } : {}),
          },
          include: { setLogs: { where: { completed: true } } },
        },
      },
      orderBy: { completedAt: "asc" },
    });

    const currentSessions = sessions.filter((s) => s.completedAt && s.completedAt >= since);
    const previousSessions = sessions.filter((s) => s.completedAt && s.completedAt < since);

    function sessionVolume(s: (typeof sessions)[number]) {
      let volume = 0;
      let setCount = 0;
      let repCount = 0;
      for (const log of s.exerciseLogs) {
        for (const set of log.setLogs) {
          if (set.weightKg && set.reps) volume += set.weightKg * set.reps;
          if (set.reps) repCount += set.reps;
          setCount += 1;
        }
      }
      return { volume, setCount, repCount };
    }

    const volumeByDate = currentSessions.map((s) => {
      const { volume, setCount, repCount } = sessionVolume(s);
      return {
        date: s.completedAt!.toISOString().slice(0, 10),
        volume: Math.round(volume),
        sets: setCount,
        reps: repCount,
        sessionName: s.day?.name ?? "Allenamento",
      };
    });

    const currentTotalVolume = volumeByDate.reduce((a, b) => a + b.volume, 0);
    const previousTotalVolume = previousSessions.reduce((a, s) => a + sessionVolume(s).volume, 0);

    const volumeChangePct =
      previousTotalVolume > 0
        ? Math.round(((currentTotalVolume - previousTotalVolume) / previousTotalVolume) * 100)
        : currentTotalVolume > 0
          ? 100
          : 0;

    // Volume by muscle group (current period only)
    const muscleGroupMap = new Map<string, number>();
    for (const s of currentSessions) {
      for (const log of s.exerciseLogs) {
        const group = log.muscleGroup ?? "Altro";
        let v = 0;
        for (const set of log.setLogs) {
          if (set.weightKg && set.reps) v += set.weightKg * set.reps;
        }
        muscleGroupMap.set(group, (muscleGroupMap.get(group) ?? 0) + v);
      }
    }
    const volumeByMuscleGroup = [...muscleGroupMap.entries()]
      .map(([muscleGroup, volume]) => ({ muscleGroup, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume);

    // e1RM progression for the selected/most-logged exercise
    const exerciseCounts = new Map<string, number>();
    for (const s of sessions) {
      for (const log of s.exerciseLogs) {
        exerciseCounts.set(log.exerciseName, (exerciseCounts.get(log.exerciseName) ?? 0) + 1);
      }
    }
    const availableExercises = [...exerciseCounts.keys()].sort();
    const targetExercise = exerciseFilter ?? [...exerciseCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    const e1rmProgression = currentSessions
      .filter((s) => s.exerciseLogs.some((l) => l.exerciseName === targetExercise))
      .map((s) => {
        const log = s.exerciseLogs.find((l) => l.exerciseName === targetExercise)!;
        let best = { weightKg: 0, reps: 0, e1rm: 0 };
        for (const set of log.setLogs) {
          if (set.weightKg && set.reps) {
            const e = estimate1RM(set.weightKg, set.reps);
            if (e > best.e1rm) best = { weightKg: set.weightKg, reps: set.reps, e1rm: e };
          }
        }
        return { date: s.completedAt!.toISOString().slice(0, 10), ...best };
      })
      .filter((d) => d.e1rm > 0);

    // Frequency: sessions per ISO week within current period
    const weekMap = new Map<string, number>();
    for (const s of currentSessions) {
      const d = s.completedAt!;
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-W${week}`;
      weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
    }
    const frequencyByWeek = [...weekMap.entries()].map(([week, count]) => ({ week, count }));

    const [personalRecords, bodyMeasurements, fatigueEntries] = await Promise.all([
      prisma.personalRecord.findMany({
        where: { studentId, achievedAt: { gte: since } },
        orderBy: { achievedAt: "desc" },
        take: 20,
      }),
      prisma.bodyMeasurement.findMany({
        where: { studentId, recordedAt: { gte: since } },
        orderBy: { recordedAt: "asc" },
      }),
      prisma.fatigueRecoveryEntry.findMany({
        where: { studentId, recordedAt: { gte: since } },
        orderBy: { recordedAt: "asc" },
      }),
    ]);

    const trend =
      volumeChangePct > 8 ? "in_crescita" : volumeChangePct < -8 ? "in_calo" : "stabile";

    return NextResponse.json({
      period: days ?? "all",
      summary: {
        totalSessions: currentSessions.length,
        totalVolume: Math.round(currentTotalVolume),
        volumeChangePct,
        trend,
        avgSessionsPerWeek:
          frequencyByWeek.length > 0
            ? Math.round((currentSessions.length / Math.max(frequencyByWeek.length, 1)) * 10) / 10
            : 0,
        recentPRCount: personalRecords.length,
      },
      volumeByDate,
      volumeByMuscleGroup,
      e1rmProgression,
      targetExercise: targetExercise ?? null,
      availableExercises,
      frequencyByWeek,
      personalRecords,
      bodyMeasurements,
      fatigueEntries,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
