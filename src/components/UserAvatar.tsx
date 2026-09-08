import { AvatarRenderer } from "@/components/Avatar";
import type { AvatarConfig } from "@/lib/avatar";
import { cn } from "@/lib/cn";

export function UserAvatar({
  userId,
  displayName,
  photoUrl,
  useAvatar,
  avatarConfig,
  size = 40,
  className,
}: {
  userId: string;
  displayName: string;
  photoUrl?: string | null;
  useAvatar?: boolean;
  avatarConfig?: AvatarConfig | null;
  size?: number;
  className?: string;
}) {
  const showPhoto = photoUrl && !useAvatar;
  if (showPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/profile-photo/${userId}`}
        alt={displayName}
        width={size}
        height={size}
        className={cn("rounded-full border border-border object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <AvatarRenderer
      config={avatarConfig}
      size={size}
      fallbackSeed={userId}
      className={cn("rounded-full border border-border", className)}
    />
  );
}
