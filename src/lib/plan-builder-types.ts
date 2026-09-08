export interface BuilderExercise {
  clientId: string;
  id?: string;
  exerciseId?: string | null;
  customName: string;
  muscleGroup?: string | null;

  sets?: number | null;
  reps?: string | null;
  repRangeMin?: number | null;
  repRangeMax?: number | null;
  loadKg?: number | null;
  percent1RM?: number | null;
  rpe?: number | null;
  rir?: number | null;
  restSeconds?: number | null;

  tempoEccentric?: number | null;
  tempoPauseBottom?: number | null;
  tempoConcentric?: number | null;
  tempoPauseTop?: number | null;
  executionTimeSeconds?: number | null;
  timeUnderTensionSeconds?: number | null;

  isDropset?: boolean;
  isRestPause?: boolean;
  isSuperset?: boolean;
  isGiantSet?: boolean;
  isCircuit?: boolean;
  isWarmupSet?: boolean;
  isAmrap?: boolean;
  isEmom?: boolean;
  toFailure?: boolean;
  supersetGroup?: string | null;
  circuitGroup?: string | null;

  priority?: number | null;
  intensityLabel?: string | null;
  technicalNotes?: string | null;
  coachNotes?: string | null;

  videoUrl?: string | null;
  imageUrl?: string | null;
  externalLink?: string | null;
}

export interface BuilderDay {
  clientId: string;
  id?: string;
  name: string;
  notes: string;
  exercises: BuilderExercise[];
}

export interface BuilderPlan {
  name: string;
  description: string;
  goal: string;
  startDate: string;
  endDate: string;
  notes: string;
  isTemplate: boolean;
  studentId: string | null;
  days: BuilderDay[];
}

let counter = 0;
export function clientId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function emptyExercise(): BuilderExercise {
  return {
    clientId: clientId("ex"),
    customName: "",
    sets: 3,
    reps: "10",
    restSeconds: 90,
  };
}

export function emptyDay(index: number): BuilderDay {
  return {
    clientId: clientId("day"),
    name: `Giorno ${String.fromCharCode(65 + index)}`,
    notes: "",
    exercises: [],
  };
}

export function emptyPlan(): BuilderPlan {
  return {
    name: "",
    description: "",
    goal: "",
    startDate: "",
    endDate: "",
    notes: "",
    isTemplate: false,
    studentId: null,
    days: [emptyDay(0)],
  };
}
