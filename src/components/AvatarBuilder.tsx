"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { AVATAR_PRESETS, type AvatarConfig } from "@/lib/avatar";
import { cn } from "@/lib/cn";

/** Carousel of the preset avatar illustrations the user can pick from. */
export function AvatarBuilder({
  config,
  onChange,
}: {
  config: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollBy(-260)}
        aria-label="Scorri indietro"
        className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm sm:flex"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto px-1 py-1 sm:px-10"
        style={{ scrollSnapType: "x proximity", scrollBehavior: "smooth" }}
      >
        {AVATAR_PRESETS.map((preset) => {
          const active = config.preset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ preset })}
              style={{ scrollSnapAlign: "start" }}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-full border-2 transition",
                active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/avatars/${preset}.png`}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 object-cover"
              />
              {active && (
                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(260)}
        aria-label="Scorri avanti"
        className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm sm:flex"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
