import { z } from "zod";

/** Only allow http(s) URLs — blocks javascript:, data:, and other unsafe schemes in stored links. */
function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const safeUrlSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || isSafeHttpUrl(v), "Deve essere un URL http/https valido")
  .optional()
  .nullable();

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
  displayName: z.string().trim().min(2, "Il nome deve avere almeno 2 caratteri").max(80),
  role: z.enum(["TRAINER", "STUDENT"]),
  inviteCode: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email non valida"),
  password: z.string().min(1, "Password richiesta"),
});

export const planExerciseSchema = z.object({
  id: z.string().optional(),
  exerciseId: z.string().optional().nullable(),
  customName: z.string().trim().min(1, "Nome esercizio richiesto"),
  muscleGroup: z.string().trim().optional().nullable(),
  orderIndex: z.number().int(),

  sets: z.number().int().min(0).optional().nullable(),
  reps: z.string().trim().optional().nullable(),
  repRangeMin: z.number().int().optional().nullable(),
  repRangeMax: z.number().int().optional().nullable(),
  loadKg: z.number().optional().nullable(),
  percent1RM: z.number().optional().nullable(),
  rpe: z.number().optional().nullable(),
  rir: z.number().optional().nullable(),
  restSeconds: z.number().int().optional().nullable(),

  tempoEccentric: z.number().int().optional().nullable(),
  tempoPauseBottom: z.number().int().optional().nullable(),
  tempoConcentric: z.number().int().optional().nullable(),
  tempoPauseTop: z.number().int().optional().nullable(),
  executionTimeSeconds: z.number().int().optional().nullable(),
  timeUnderTensionSeconds: z.number().int().optional().nullable(),

  isDropset: z.boolean().optional(),
  isRestPause: z.boolean().optional(),
  isSuperset: z.boolean().optional(),
  isGiantSet: z.boolean().optional(),
  isCircuit: z.boolean().optional(),
  isWarmupSet: z.boolean().optional(),
  isAmrap: z.boolean().optional(),
  isEmom: z.boolean().optional(),
  toFailure: z.boolean().optional(),
  supersetGroup: z.string().trim().optional().nullable(),
  circuitGroup: z.string().trim().optional().nullable(),

  priority: z.number().int().optional().nullable(),
  intensityLabel: z.string().trim().optional().nullable(),
  technicalNotes: z.string().trim().optional().nullable(),
  coachNotes: z.string().trim().optional().nullable(),

  videoUrl: safeUrlSchema,
  imageUrl: safeUrlSchema,
  externalLink: safeUrlSchema,
});

export const planDaySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nome giornata richiesto"),
  orderIndex: z.number().int(),
  notes: z.string().trim().optional().nullable(),
  exercises: z.array(planExerciseSchema).default([]),
});

export const planSaveSchema = z.object({
  name: z.string().trim().min(1, "Nome scheda richiesto").max(120),
  description: z.string().trim().optional().nullable(),
  goal: z.string().trim().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  isTemplate: z.boolean().optional(),
  studentId: z.string().optional().nullable(),
  days: z.array(planDaySchema).default([]),
  versionNote: z.string().trim().optional().nullable(),
});

export const measurementSchema = z.object({
  weightKg: z.number().optional().nullable(),
  bodyFatPct: z.number().optional().nullable(),
  chestCm: z.number().optional().nullable(),
  waistCm: z.number().optional().nullable(),
  hipsCm: z.number().optional().nullable(),
  armCm: z.number().optional().nullable(),
  thighCm: z.number().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const fatigueSchema = z.object({
  fatigue: z.number().int().min(1).max(10).optional().nullable(),
  energy: z.number().int().min(1).max(10).optional().nullable(),
  recovery: z.number().int().min(1).max(10).optional().nullable(),
  sleepQuality: z.number().int().min(1).max(10).optional().nullable(),
  stress: z.number().int().min(1).max(10).optional().nullable(),
  doms: z.number().int().min(1).max(10).optional().nullable(),
  difficulty: z.number().int().min(1).max(10).optional().nullable(),
  motivation: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1000).optional().nullable(),
  useAvatar: z.boolean().optional(),
  avatarConfig: z.record(z.string(), z.string()).optional().nullable(),
});
