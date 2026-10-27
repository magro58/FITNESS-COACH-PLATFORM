// Avatar system: users pick one of a fixed set of pre-made illustrated
// avatars (static images in public/avatars) instead of generating one from
// traits. Persisted as { preset: "avatar-07" } on Profile.avatarConfig.

export type AvatarConfig = {
  preset: string;
};

export const AVATAR_PRESETS: string[] = Array.from(
  { length: 20 },
  (_, i) => `avatar-${String(i + 1).padStart(2, "0")}`
);

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function defaultAvatarConfig(seed: string): AvatarConfig {
  const preset = AVATAR_PRESETS[hashString(seed) % AVATAR_PRESETS.length];
  return { preset };
}

export function isValidAvatarConfig(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== "object") return false;
  const preset = (value as Record<string, unknown>).preset;
  return typeof preset === "string" && AVATAR_PRESETS.includes(preset);
}

/** Path to the preset's static image, served from /public/avatars. */
export function avatarImageSrc(config: AvatarConfig): string {
  return `/avatars/${config.preset}.png`;
}
