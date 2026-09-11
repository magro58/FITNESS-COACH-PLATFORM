"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";

export function ImpersonationBanner({
  displayName,
  roleLabel,
  adminEmail,
}: {
  displayName: string;
  roleLabel: string;
  adminEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function stop() {
    setLoading(true);
    await fetch("/api/admin/stop-impersonation", { method: "POST" });
    window.location.href = "/admin";
  }

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-xs font-medium text-warning-foreground sm:text-sm">
      <ShieldAlert size={15} className="shrink-0" />
      <span>
        Stai visualizzando l&apos;app come <strong>{displayName}</strong> ({roleLabel}) — accesso admin di{" "}
        {adminEmail}
      </span>
      <button
        onClick={stop}
        disabled={loading}
        className="ml-1 inline-flex items-center gap-1 rounded-md bg-black/10 px-2.5 py-1 font-semibold hover:bg-black/20 disabled:opacity-60"
      >
        {loading && <Loader2 size={12} className="animate-spin" />}
        Torna al pannello admin
      </button>
    </div>
  );
}
