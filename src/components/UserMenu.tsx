"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/components/user-context";
import { AvatarRenderer } from "@/components/Avatar";

export function UserMenu() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const hasPhoto = user.profile?.photoUrl && !user.profile.useAvatar;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2 transition hover:bg-muted"
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/profile-photo/${user.id}`}
            alt={user.profile?.displayName ?? "Profilo"}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <AvatarRenderer config={user.profile?.avatarConfig} size={28} fallbackSeed={user.id} />
        )}
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.profile?.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
          >
            <UserIcon size={15} /> Il mio profilo
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger hover:bg-danger/10"
          >
            <LogOut size={15} /> Esci
          </button>
        </div>
      )}
    </div>
  );
}
