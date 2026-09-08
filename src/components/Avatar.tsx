import type { AvatarConfig } from "@/lib/avatar";
import { defaultAvatarConfig } from "@/lib/avatar";

// A flat, layered SVG avatar renderer driven entirely by AvatarConfig.
// Every visual trait (face shape, hair, facial hair, eyes, accessory,
// outfit, colors, background) maps to a distinct config field so it can be
// mixed independently in the avatar builder.

function FaceShape({ shape, skin }: { shape: string; skin: string }) {
  if (shape === "square") return <rect x="30" y="34" width="68" height="72" rx="22" fill={skin} />;
  if (shape === "oval") return <ellipse cx="64" cy="70" rx="32" ry="38" fill={skin} />;
  return <circle cx="64" cy="70" r="34" fill={skin} />;
}

function Hair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "bald":
      return null;
    case "buzz":
      return <path d="M30 58a34 34 0 0 1 68 0v-8a34 34 0 0 0-68 0z" fill={color} />;
    case "curly":
      return (
        <g fill={color}>
          <circle cx="34" cy="42" r="12" />
          <circle cx="48" cy="30" r="13" />
          <circle cx="64" cy="26" r="14" />
          <circle cx="80" cy="30" r="13" />
          <circle cx="94" cy="42" r="12" />
        </g>
      );
    case "long":
      return (
        <path
          d="M28 46a36 36 0 0 1 72 0v40h-12V60c0-4-3-6-6-6s-6 4-6 8v30H36V62c0-4-3-8-6-8s-6 2-6 6v24H12V60z"
          fill={color}
        />
      );
    case "ponytail":
      return (
        <g fill={color}>
          <path d="M30 54a34 34 0 0 1 68 0v-6a34 34 0 0 0-68 0z" />
          <path d="M96 44c10 2 16 12 12 26-3 10-2 18 3 26l-12 4c-6-10-8-20-5-32 2-8 1-16-2-22z" />
        </g>
      );
    case "mohawk":
      return (
        <g fill={color}>
          <path d="M54 16c4 10 4 22 0 34h20c-4-12-4-24 0-34-6-4-14-4-20 0z" />
        </g>
      );
    default:
      return <path d="M28 52a36 36 0 0 1 72 0v-4a36 36 0 0 0-72 0z" fill={color} />;
  }
}

function FacialHair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "mustache":
      return <path d="M48 86c6 5 22 5 28 0-6 6-22 6-28 0z" fill={color} />;
    case "goatee":
      return <path d="M54 92c4 10 16 10 20 0-2 8-18 8-20 0z" fill={color} />;
    case "full-beard":
      return (
        <path
          d="M32 66c0 22 12 38 32 38s32-16 32-38c0 14-8 22-14 22 2-6 2-10 0-14-4 6-10 8-18 8s-14-2-18-8c-2 4-2 8 0 14-6 0-14-8-14-22z"
          fill={color}
          opacity="0.92"
        />
      );
    case "stubble":
      return <ellipse cx="64" cy="88" rx="26" ry="16" fill={color} opacity="0.18" />;
    default:
      return null;
  }
}

function Eyes({ style }: { style: string }) {
  if (style === "happy")
    return (
      <g stroke="#1f2937" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M50 66q6-8 12 0" />
        <path d="M78 66q6-8 12 0" />
      </g>
    );
  if (style === "wink")
    return (
      <g fill="#1f2937">
        <circle cx="56" cy="66" r="3.5" />
        <path d="M78 66q6-6 12 0" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    );
  if (style === "focused")
    return (
      <g fill="#1f2937">
        <rect x="49" y="64" width="14" height="4" rx="2" />
        <rect x="77" y="64" width="14" height="4" rx="2" />
      </g>
    );
  return (
    <g fill="#1f2937">
      <circle cx="56" cy="66" r="3.5" />
      <circle cx="84" cy="66" r="3.5" />
    </g>
  );
}

function Accessory({ style }: { style: string }) {
  switch (style) {
    case "glasses":
      return (
        <g stroke="#1f2937" strokeWidth="3" fill="none">
          <circle cx="56" cy="66" r="11" />
          <circle cx="84" cy="66" r="11" />
          <path d="M67 66h6M45 64l-8-2M96 64l8-2" />
        </g>
      );
    case "sunglasses":
      return (
        <g>
          <rect x="45" y="58" width="22" height="14" rx="6" fill="#111827" />
          <rect x="73" y="58" width="22" height="14" rx="6" fill="#111827" />
          <path d="M67 63h6" stroke="#111827" strokeWidth="3" />
        </g>
      );
    case "headband":
      return <rect x="26" y="46" width="76" height="10" rx="5" fill="#ef4444" />;
    case "earrings":
      return (
        <g fill="#f4d03f">
          <circle cx="30" cy="80" r="3" />
          <circle cx="98" cy="80" r="3" />
        </g>
      );
    default:
      return null;
  }
}

function Outfit({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "hoodie":
      return (
        <g>
          <path d="M10 128c4-22 20-34 54-34s50 12 54 34z" fill={color} />
          <path d="M40 100c8 8 40 8 48 0l6 10c-18 10-42 10-60 0z" fill="#000" opacity="0.12" />
        </g>
      );
    case "tank":
      return <path d="M20 128c2-18 14-30 44-30s42 12 44 30z" fill={color} />;
    case "tracksuit":
      return (
        <g>
          <path d="M8 128c4-24 22-36 56-36s52 12 56 36z" fill={color} />
          <path d="M8 128l14-30 6 4-10 26zM120 128l-14-30-6 4 10 26z" fill="#fff" opacity="0.8" />
        </g>
      );
    case "singlet":
      return <path d="M24 128c2-16 12-26 40-26s38 10 40 26z" fill={color} />;
    default:
      return <path d="M14 128c4-20 18-32 50-32s46 12 50 32z" fill={color} />;
  }
}

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
  const cfg = config ?? defaultAvatarConfig(fallbackSeed);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      role="img"
      aria-label="Avatar"
    >
      <rect width="128" height="128" rx="24" fill={cfg.background} />
      <g clipPath="url(#avatarClip)">
        <Outfit style={cfg.outfit} color={cfg.outfitColor} />
        <FaceShape shape={cfg.faceShape} skin={cfg.skinTone} />
        <FacialHair style={cfg.facialHair} color={cfg.hairColor} />
        <Eyes style={cfg.eyeStyle} />
        <Hair style={cfg.hairStyle} color={cfg.hairColor} />
        <Accessory style={cfg.accessory} />
      </g>
      <defs>
        <clipPath id="avatarClip">
          <rect width="128" height="128" rx="24" />
        </clipPath>
      </defs>
    </svg>
  );
}
