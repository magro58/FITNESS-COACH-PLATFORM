"use client";

import { signInWithGoogle, signInWithMicrosoft, signInWithApple } from "@/lib/oauth-actions";
import type { OAuthProviderId } from "@/lib/oauth";

const PROVIDER_META: Record<
  OAuthProviderId,
  { label: string; action: () => Promise<void>; icon: React.ReactNode }
> = {
  google: {
    label: "Continua con Google",
    action: signInWithGoogle,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.95 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.27-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l3-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"
        />
      </svg>
    ),
  },
  "microsoft-entra-id": {
    label: "Continua con Microsoft",
    action: signInWithMicrosoft,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <rect x="0" y="0" width="8.5" height="8.5" fill="#F25022" />
        <rect x="9.5" y="0" width="8.5" height="8.5" fill="#7FBA00" />
        <rect x="0" y="9.5" width="8.5" height="8.5" fill="#00A4EF" />
        <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900" />
      </svg>
    ),
  },
  apple: {
    label: "Continua con Apple",
    action: signInWithApple,
    icon: (
      <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden fill="currentColor">
        <path d="M13.15 9.53c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.65 0-1.63-.73-2.68-.71-1.38.02-2.65.8-3.36 2.03-1.43 2.48-.37 6.16 1.03 8.18.68.99 1.5 2.1 2.57 2.06 1.03-.04 1.42-.66 2.67-.66 1.24 0 1.6.66 2.68.64 1.11-.02 1.82-1.01 2.5-2 .78-1.15 1.11-2.27 1.13-2.33-.02-.01-2.17-.83-2.2-3.24zM10.9 3.22c.57-.7.96-1.66.85-2.62-.82.03-1.82.55-2.4 1.24-.53.61-.99 1.6-.87 2.53.91.07 1.85-.46 2.42-1.15z" />
      </svg>
    ),
  },
};

export function OAuthButtons({ providers }: { providers: OAuthProviderId[] }) {
  if (providers.length === 0) return null;

  return (
    <div className="space-y-2">
      {providers.map((id) => {
        const meta = PROVIDER_META[id];
        return (
          <form key={id} action={meta.action}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {meta.icon}
              {meta.label}
            </button>
          </form>
        );
      })}
    </div>
  );
}
