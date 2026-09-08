"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import type { AvatarConfig } from "@/lib/avatar";

interface LinkedTrainer {
  id: string;
  profile: {
    displayName: string;
    photoUrl: string | null;
    useAvatar: boolean;
    avatarConfig: AvatarConfig | null;
  } | null;
}

export function TrainerLinkCard() {
  const [trainer, setTrainer] = useState<LinkedTrainer | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setTrainer(data.user?.linkedTrainer ?? null));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/link-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Collegato con successo al tuo Personal Trainer");
      router.refresh();
      const me = await fetch("/api/auth/me").then((r) => r.json());
      setTrainer(me.user?.linkedTrainer ?? null);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Codice non valido");
    } finally {
      setLoading(false);
    }
  }

  if (trainer === undefined) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Il tuo Personal Trainer</CardTitle>
        <CardDescription>
          {trainer
            ? "Sei collegato al tuo personal trainer."
            : "Inserisci il codice invito ricevuto dal tuo Personal Trainer per collegarti."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trainer ? (
          <div className="flex items-center gap-3">
            <UserAvatar
              userId={trainer.id}
              displayName={trainer.profile?.displayName ?? ""}
              photoUrl={trainer.profile?.photoUrl}
              useAvatar={trainer.profile?.useAvatar}
              avatarConfig={trainer.profile?.avatarConfig}
              size={44}
            />
            <div>
              <p className="font-medium">{trainer.profile?.displayName}</p>
              <p className="flex items-center gap-1 text-xs text-primary">
                <Check size={12} /> Collegato
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Codice invito"
              required
            />
            <Button type="submit" loading={loading}>
              <Link2 size={15} /> Collega
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
