import type { AvatarConfig } from "@/lib/avatar";
import { defaultAvatarConfig, isValidAvatarConfig, renderAvatarDataUri } from "@/lib/avatar";

/**
 * Renders a DiceBear "avataaars" avatar from an AvatarConfig. Generation
 * happens on our own server (renderAvatarDataUri), not via a third-party API
 * call, and the result is a self-contained SVG data URI.
 *
 * Falls back to a deterministic default when the config is missing or is in
 * an older/invalid shape (e.g. a profile saved before this avatar system),
 * so nothing ever renders broken.
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
  const dataUri = renderAvatarDataUri(cfg);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUri}
      width={size}
      height={size}
      alt="Avatar"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
