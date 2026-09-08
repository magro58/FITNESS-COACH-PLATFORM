// Avatar configuration: a compact set of choices persisted as JSON on
// Profile.avatarConfig and rendered by <AvatarRenderer /> (src/components/Avatar.tsx).

export type AvatarConfig = {
  faceShape: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  facialHair: string;
  eyeStyle: string;
  accessory: string;
  outfit: string;
  outfitColor: string;
  background: string;
};

export const AVATAR_OPTIONS = {
  faceShape: ["round", "oval", "square"] as const,
  skinTone: ["#F4C29A", "#E8AD7E", "#C98457", "#8D5A3C", "#5C3A26"] as const,
  hairStyle: ["bald", "short", "buzz", "curly", "long", "ponytail", "mohawk"] as const,
  hairColor: ["#1B1B1B", "#4A2E1A", "#8B5A2B", "#C99A3B", "#A83C2E", "#D8D8D8"] as const,
  facialHair: ["none", "mustache", "goatee", "full-beard", "stubble"] as const,
  eyeStyle: ["normal", "happy", "focused", "wink"] as const,
  accessory: ["none", "glasses", "sunglasses", "headband", "earrings"] as const,
  outfit: ["tshirt", "tank", "hoodie", "tracksuit", "singlet"] as const,
  outfitColor: ["#2563EB", "#DC2626", "#059669", "#7C3AED", "#EA580C", "#0F172A", "#DB2777"] as const,
  background: [
    "#E0F2FE",
    "#FCE7F3",
    "#DCFCE7",
    "#FEF3C7",
    "#EDE9FE",
    "#FFE4E6",
    "#111827",
  ] as const,
};

function pick<T extends readonly string[]>(arr: T, seed: number): T[number] {
  return arr[seed % arr.length];
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function defaultAvatarConfig(seed: string): AvatarConfig {
  const h = hashString(seed);
  return {
    faceShape: pick(AVATAR_OPTIONS.faceShape, h),
    skinTone: pick(AVATAR_OPTIONS.skinTone, h >> 2),
    hairStyle: pick(AVATAR_OPTIONS.hairStyle, h >> 3),
    hairColor: pick(AVATAR_OPTIONS.hairColor, h >> 4),
    facialHair: pick(AVATAR_OPTIONS.facialHair, h >> 5),
    eyeStyle: pick(AVATAR_OPTIONS.eyeStyle, h >> 6),
    accessory: pick(AVATAR_OPTIONS.accessory, h >> 7),
    outfit: pick(AVATAR_OPTIONS.outfit, h >> 8),
    outfitColor: pick(AVATAR_OPTIONS.outfitColor, h >> 9),
    background: pick(AVATAR_OPTIONS.background, h >> 10),
  };
}

export function isValidAvatarConfig(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (Object.keys(AVATAR_OPTIONS) as (keyof typeof AVATAR_OPTIONS)[]).every((key) =>
    (AVATAR_OPTIONS[key] as readonly string[]).includes(v[key] as string)
  );
}
