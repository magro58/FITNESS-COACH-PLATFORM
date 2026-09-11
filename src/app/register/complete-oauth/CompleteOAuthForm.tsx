"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

export function CompleteOAuthForm({ email, name }: { email: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [role, setRole] = useState<"TRAINER" | "STUDENT">("TRAINER");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          inviteCode: role === "STUDENT" ? inviteCode || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore durante la registrazione");
        setLoading(false);
        return;
      }
      toast.success("Account creato con successo");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Errore di rete. Riprova.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Ultimo passaggio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accesso confermato come <span className="font-medium text-foreground">{name}</span>{" "}
            ({email}). Dicci come vuoi usare la piattaforma.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div>
            <Label>Sei un Personal Trainer o un Allievo?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("TRAINER")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition",
                  role === "TRAINER"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <Dumbbell size={22} />
                Personal Trainer
              </button>
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition",
                  role === "STUDENT"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <Users size={22} />
                Allievo
              </button>
            </div>
          </div>

          {role === "STUDENT" && (
            <div>
              <Label htmlFor="inviteCode">Codice invito del tuo Personal Trainer (opzionale)</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Es. AB12CD34"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Puoi collegarti al tuo PT anche più tardi dal tuo profilo.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Completa registrazione
          </Button>
        </form>
      </div>
    </div>
  );
}
