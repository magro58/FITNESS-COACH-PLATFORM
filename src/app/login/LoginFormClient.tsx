"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { OAuthButtons } from "@/components/OAuthButtons";
import type { OAuthProviderId } from "@/lib/oauth";

function LoginForm({ configuredProviders }: { configuredProviders: OAuthProviderId[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("disabled") === "1") {
      setError("Questo account è stato disabilitato. Contatta l'assistenza.");
    } else if (params.get("error") === "oauth_failed") {
      setError("Accesso con provider social non riuscito. Riprova.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore durante l'accesso");
        setLoading(false);
        return;
      }
      toast.success("Bentornato!");
      const fallback = data.user?.role === "ADMIN" ? "/admin" : "/dashboard";
      router.push(params.get("next") ?? fallback);
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
          <h1 className="text-2xl font-bold tracking-tight">Bentornato</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accedi al tuo account</p>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          {configuredProviders.length > 0 && (
            <>
              <OAuthButtons providers={configuredProviders} />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                oppure con email
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario@esempio.it"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="La tua password"
              />
            </div>

            {error && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Accedi
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Non hai un account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

export function LoginFormClient({ configuredProviders }: { configuredProviders: OAuthProviderId[] }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <LoginForm configuredProviders={configuredProviders} />
    </Suspense>
  );
}
