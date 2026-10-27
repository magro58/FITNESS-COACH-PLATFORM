import type { AvatarConfig } from "@/lib/avatar";
import { avatarImageSrc, defaultAvatarConfig, isValidAvatarConfig } from "@/lib/avatar";

/**
 * Renders a user's chosen preset avatar (a static illustration from
 * public/avatars). Falls back to a deterministic default when the config is
 * missing or in an older/invalid shape (e.g. a profile saved before this
 * avatar system), so nothing ever renders broken.
 */
export function AvatarRenderer({
  config,
  size = 96,
  className,
  fallbackSeed = "user",
}: {
  config?: AvatarConfig | null;
  size?: number;
  className?: string;
  fallbackSeed?: string;
}) {
  const cfg = isValidAvatarConfig(config) ? config : defaultAvatarConfig(fallbackSeed);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarImageSrc(cfg)}
      width={size}
      height={size}
      alt="Avatar"
      className={className}
      style={{ width: size, height: size, objectFit: "cover" }}
    />
  );
}
