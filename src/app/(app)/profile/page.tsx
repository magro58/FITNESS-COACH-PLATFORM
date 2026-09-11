"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Trash2, Sparkles, Save, LifeBuoy, ChevronRight } from "lucide-react";
import { useCurrentUser } from "@/components/user-context";
import { AvatarRenderer } from "@/components/Avatar";
import { AvatarBuilder } from "@/components/AvatarBuilder";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { defaultAvatarConfig, isValidAvatarConfig, type AvatarConfig } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import { TrainerLinkCard } from "@/components/TrainerLinkCard";

export default function ProfilePage() {
  const user = useCurrentUser();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user.profile?.displayName ?? "");
  const [bio, setBio] = useState(user.profile?.bio ?? "");
  const [useAvatar, setUseAvatar] = useState(user.profile?.useAvatar ?? true);
  const [hasPhoto, setHasPhoto] = useState(!!user.profile?.photoUrl);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(
    isValidAvatarConfig(user.profile?.avatarConfig)
      ? user.profile.avatarConfig
      : defaultAvatarConfig(user.id)
  );
  const [photoVersion, setPhotoVersion] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);

  const showingPhoto = hasPhoto && !useAvatar;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profilo aggiornato");
      router.refresh();
    } catch {
      toast.error("Errore durante il salvataggio");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAvatarConfig(next: AvatarConfig) {
    setAvatarConfig(next);
  }

  async function persistAvatar() {
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarConfig, useAvatar: true }),
      });
      if (!res.ok) throw new Error();
      setUseAvatar(true);
      toast.success("Avatar salvato");
      router.refresh();
    } catch {
      toast.error("Errore durante il salvataggio dell'avatar");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/profile/photo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHasPhoto(true);
      setUseAvatar(false);
      setPhotoVersion((v) => v + 1);
      toast.success("Foto profilo aggiornata");
      router.refresh();
    } catch {
      toast.error("Errore durante il caricamento della foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    try {
      await fetch("/api/profile/photo", { method: "DELETE" });
      setHasPhoto(false);
      setUseAvatar(true);
      toast.success("Foto rimossa, ora usi l'avatar");
      router.refresh();
    } catch {
      toast.error("Errore durante la rimozione della foto");
    }
  }

  async function useAvatarInstead() {
    setUseAvatar(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, useAvatar: true }),
    });
    toast.success("Ora usi l'avatar come immagine profilo");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Il mio profilo</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci i tuoi dati, la foto profilo o il tuo avatar personalizzato.
        </p>
      </div>

      {user.role === "STUDENT" && <TrainerLinkCard />}

      <Link href="/support">
        <Card className="transition hover:border-primary/40 hover:bg-muted/40">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LifeBuoy size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Assistenza</p>
              <p className="text-xs text-muted-foreground">Apri una richiesta o consulta i tuoi ticket</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Immagine profilo</CardTitle>
          <CardDescription>Scegli tra una foto caricata oppure un avatar personalizzabile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            {showingPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photoVersion}
                src={`/api/profile-photo/${user.id}?v=${photoVersion}`}
                alt={displayName}
                className="h-28 w-28 rounded-2xl border border-border object-cover"
              />
            ) : (
              <AvatarRenderer
                config={avatarConfig}
                size={112}
                className="rounded-2xl border border-border"
              />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={15} /> Carica foto
              </Button>
              {hasPhoto && (
                <Button type="button" variant="outline" size="sm" onClick={removePhoto}>
                  <Trash2 size={15} /> Rimuovi foto
                </Button>
              )}
              {showingPhoto && (
                <Button type="button" variant="outline" size="sm" onClick={useAvatarInstead}>
                  <Sparkles size={15} /> Usa l&apos;avatar
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formati supportati: JPG, PNG, WEBP, GIF. Visibile a te e al tuo{" "}
              {user.role === "TRAINER" ? "allievi collegati" : "personal trainer"}.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dati personali</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Nome visualizzato</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio ?? ""}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Racconta qualcosa di te..."
              />
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Email: <span className="font-medium text-foreground">{user.email}</span> · Ruolo:{" "}
              <span className="font-medium text-foreground">
                {user.role === "TRAINER" ? "Personal Trainer" : "Allievo"}
              </span>
            </div>
            <Button type="submit" loading={savingProfile}>
              <Save size={15} /> Salva modifiche
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personalizza il tuo avatar</CardTitle>
          <CardDescription>
            Scegli viso, capelli, barba, colori, accessori, abbigliamento e sfondo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarBuilder config={avatarConfig} onChange={saveAvatarConfig} />
          <Button
            type="button"
            onClick={persistAvatar}
            loading={savingAvatar}
            className={cn(!useAvatar && "animate-pulse-soft")}
          >
            <Save size={15} /> Salva e usa questo avatar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
