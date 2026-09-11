import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

// Avatar configuration, rendered with DiceBear's "avataaars" style
// (self-hosted generation — see src/components/Avatar.tsx — no calls to a
// third-party API at runtime). Persisted as-is on Profile.avatarConfig.

export type AvatarConfig = {
  top: string;
  hairColor: string;
  facialHair: string; // "none" or one of AVATAR_OPTIONS.facialHair
  facialHairColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  skinColor: string;
  accessories: string; // "none" or one of AVATAR_OPTIONS.accessories
  accessoriesColor: string;
  clothing: string;
  clothesColor: string;
  backgroundColor: string;
};

export const NONE = "none";

export const AVATAR_OPTIONS = {
  top: [
    "shortFlat",
    "shortRound",
    "shortWaved",
    "shortCurly",
    "shaggy",
    "shaggyMullet",
    "sides",
    "theCaesar",
    "theCaesarAndSidePart",
    "curly",
    "curvy",
    "straight01",
    "straight02",
    "straightAndStrand",
    "dreads",
    "dreads01",
    "dreads02",
    "frizzle",
    "fro",
    "froBand",
    "bigHair",
    "bob",
    "bun",
    "miaWallace",
    "longButNotTooLong",
    "shavedSides",
    "hat",
    "hijab",
    "turban",
    "winterHat1",
    "winterHat02",
    "winterHat03",
    "winterHat04",
  ] as const,
  hairColor: [
    "2c1b18",
    "4a312c",
    "724133",
    "a55728",
    "b58143",
    "d6b370",
    "ecdcbf",
    "c93305",
    "e8e1e1",
    "f59797",
  ] as const,
  facialHair: [NONE, "beardLight", "beardMedium", "beardMajestic", "moustacheFancy", "moustacheMagnum"] as const,
  facialHairColor: [
    "2c1b18",
    "4a312c",
    "724133",
    "a55728",
    "b58143",
    "d6b370",
    "ecdcbf",
    "c93305",
    "e8e1e1",
    "f59797",
  ] as const,
  eyes: [
    "default",
    "happy",
    "wink",
    "winkWacky",
    "side",
    "squint",
    "surprised",
    "closed",
    "cry",
    "eyeRoll",
    "hearts",
    "xDizzy",
  ] as const,
  eyebrows: [
    "default",
    "defaultNatural",
    "raisedExcited",
    "raisedExcitedNatural",
    "angry",
    "angryNatural",
    "sadConcerned",
    "sadConcernedNatural",
    "unibrowNatural",
    "upDown",
    "upDownNatural",
    "flatNatural",
    "frownNatural",
  ] as const,
  mouth: [
    "default",
    "smile",
    "twinkle",
    "serious",
    "concerned",
    "disbelief",
    "sad",
    "eating",
    "grimace",
    "screamOpen",
    "tongue",
    "vomit",
  ] as const,
  skinColor: ["614335", "ae5d29", "d08b5b", "edb98a", "ffdbb4", "fd9841", "f8d25c"] as const,
  accessories: [NONE, "prescription01", "prescription02", "round", "wayfarers", "sunglasses", "kurt", "eyepatch"] as const,
  accessoriesColor: ["262e33", "65c9ff", "5199e4", "25557c", "929598", "e6e6e6", "a7ffc4", "ff488e"] as const,
  clothing: [
    "shirtCrewNeck",
    "shirtVNeck",
    "shirtScoopNeck",
    "hoodie",
    "collarAndSweater",
    "blazerAndShirt",
    "blazerAndSweater",
    "graphicShirt",
    "overall",
  ] as const,
  clothesColor: ["262e33", "65c9ff", "5199e4", "25557c", "929598", "e6e6e6", "a7ffc4", "ffafb9", "ff5c5c", "ffffff"] as const,
  backgroundColor: [
    "b6e3f4",
    "c0f2c7",
    "ffd6a5",
    "ffdfba",
    "ffb3ba",
    "d5c4f0",
    "f4e1d2",
    "e0e0e0",
    "0b0d10",
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
    top: pick(AVATAR_OPTIONS.top, h),
    hairColor: pick(AVATAR_OPTIONS.hairColor, h >> 2),
    facialHair: pick(AVATAR_OPTIONS.facialHair, h >> 3),
    facialHairColor: pick(AVATAR_OPTIONS.facialHairColor, h >> 4),
    eyes: pick(AVATAR_OPTIONS.eyes, h >> 5),
    eyebrows: pick(AVATAR_OPTIONS.eyebrows, h >> 6),
    mouth: pick(AVATAR_OPTIONS.mouth, h >> 7),
    skinColor: pick(AVATAR_OPTIONS.skinColor, h >> 8),
    accessories: pick(AVATAR_OPTIONS.accessories, h >> 9),
    accessoriesColor: pick(AVATAR_OPTIONS.accessoriesColor, h >> 10),
    clothing: pick(AVATAR_OPTIONS.clothing, h >> 11),
    clothesColor: pick(AVATAR_OPTIONS.clothesColor, h >> 12),
    backgroundColor: pick(AVATAR_OPTIONS.backgroundColor, h >> 13),
  };
}

export function isValidAvatarConfig(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (Object.keys(AVATAR_OPTIONS) as (keyof typeof AVATAR_OPTIONS)[]).every((key) =>
    (AVATAR_OPTIONS[key] as readonly string[]).includes(v[key] as string)
  );
}

/** Renders the avatar as a self-contained SVG data URI (no network call). */
export function renderAvatarDataUri(config: AvatarConfig): string {
  const options: Record<string, unknown> = {
    // Every trait below is pinned explicitly, but a few style-level fields
    // (e.g. avatar shape) aren't part of AvatarConfig; deriving the seed
    // from the config keeps those deterministic too, without needing a
    // separate seed input.
    seed: JSON.stringify(config),
    style: ["default"],
    top: [config.top],
    topProbability: 100,
    hairColor: [config.hairColor],
    eyes: [config.eyes],
    eyebrows: [config.eyebrows],
    mouth: [config.mouth],
    skinColor: [config.skinColor],
    clothing: [config.clothing],
    clothesColor: [config.clothesColor],
    backgroundColor: [config.backgroundColor],
  };

  if (config.facialHair && config.facialHair !== NONE) {
    options.facialHair = [config.facialHair];
    options.facialHairProbability = 100;
    options.facialHairColor = [config.facialHairColor];
  } else {
    options.facialHairProbability = 0;
  }

  if (config.accessories && config.accessories !== NONE) {
    options.accessories = [config.accessories];
    options.accessoriesProbability = 100;
    options.accessoriesColor = [config.accessoriesColor];
  } else {
    options.accessoriesProbability = 0;
  }

  return createAvatar(avataaars, options).toDataUri();
}
