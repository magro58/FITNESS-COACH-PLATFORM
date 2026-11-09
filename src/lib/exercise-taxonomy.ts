// Taxonomy for the exercise catalog (see prisma/data/exercises.json), used
// to render readable labels and build filter dropdowns.

export const MUSCLE_GROUPS: { value: string; label: string }[] = [
  { value: "PETTO", label: "Petto" },
  { value: "SPALLE", label: "Spalle" },
  { value: "GRAN_DORSALE", label: "Gran dorsale" },
  { value: "CENTRO_SCHIENA", label: "Centro schiena" },
  { value: "BICIPITI", label: "Bicipiti" },
  { value: "TRICIPITI", label: "Tricipiti" },
  { value: "ADDOME", label: "Addome" },
  { value: "GAMBE_QUADRICIPITI", label: "Gambe (quadricipiti)" },
  { value: "GAMBE_POSTERIORE", label: "Gambe (femorali)" },
  { value: "GLUTEI", label: "Glutei" },
  { value: "POLPACCI", label: "Polpacci" },
];

export const MUSCLE_GROUP_LABELS: Record<string, string> = Object.fromEntries(
  MUSCLE_GROUPS.map((g) => [g.value, g.label])
);

/** Equipment is tiered: picking a tier also includes everything in the tiers below it. */
export const EQUIPMENT_TIERS: { value: string; label: string }[] = [
  { value: "Attrezzatura limitata", label: "Attrezzatura limitata" },
  { value: "Home gym", label: "Home gym" },
  { value: "Palestra completa", label: "Palestra completa" },
];

export const DIFFICULTY_LEVELS: { value: string; label: string }[] = [
  { value: "Principiante", label: "Principiante" },
  { value: "Intermedio", label: "Intermedio" },
  { value: "Avanzato", label: "Avanzato" },
];

export const EXERCISE_ROLE_LABELS: Record<string, string> = {
  MAIN: "Main",
  ACCESSORIO: "Accessorio",
};

export function muscleGroupLabel(value?: string | null): string {
  if (!value) return "";
  return MUSCLE_GROUP_LABELS[value] ?? value;
}
