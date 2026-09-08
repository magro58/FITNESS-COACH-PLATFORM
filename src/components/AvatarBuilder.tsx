"use client";

import { AVATAR_OPTIONS, type AvatarConfig } from "@/lib/avatar";
import { AvatarRenderer } from "@/components/Avatar";
import { cn } from "@/lib/cn";

const LABELS: Record<keyof typeof AVATAR_OPTIONS, string> = {
  faceShape: "Forma del viso",
  skinTone: "Colore pelle",
  hairStyle: "Capelli",
  hairColor: "Colore capelli",
  facialHair: "Barba",
  eyeStyle: "Occhi",
  accessory: "Accessorio",
  outfit: "Abbigliamento",
  outfitColor: "Colore abbigliamento",
  background: "Sfondo",
};

const COLOR_FIELDS = new Set(["skinTone", "hairColor", "outfitColor", "background"]);

export function AvatarBuilder({
  config,
  onChange,
}: {
  config: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex flex-col items-center gap-2 sm:sticky sm:top-20 sm:self-start">
        <AvatarRenderer config={config} size={160} className="rounded-2xl border border-border" />
        <span className="text-xs text-muted-foreground">Anteprima</span>
      </div>

      <div className="flex-1 space-y-5">
        {(Object.keys(AVATAR_OPTIONS) as (keyof typeof AVATAR_OPTIONS)[]).map((key) => (
          <div key={key}>
            <p className="mb-2 text-sm font-medium text-foreground/90">{LABELS[key]}</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS[key].map((option) => {
                const active = config[key] === option;
                if (COLOR_FIELDS.has(key)) {
                  return (
                    <button
                      key={option}
                      type="button"
                      title={option}
                      onClick={() => onChange({ ...config, [key]: option })}
                      className={cn(
                        "h-9 w-9 rounded-full border-2 transition",
                        active ? "border-primary scale-110" : "border-border"
                      )}
                      style={{ background: option }}
                    />
                  );
                }
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange({ ...config, [key]: option })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {option.replace("-", " ")}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
