"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/components/user-context";
import { DIRECT_UPLOAD, uploadFileDirect } from "@/lib/upload-client";

interface StudentOption {
  studentId: string;
  profile: { displayName: string } | null;
}

export function MediaComposer({ onSent }: { onSent: () => void }) {
  const user = useCurrentUser();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [note, setNote] = useState("");
  const [context, setContext] = useState("GENERAL");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user.role === "TRAINER") {
      fetch("/api/students")
        .then((r) => r.json())
        .then((d) => setStudents(d.students ?? []));
    }
  }, [user.role]);

  async function send() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Seleziona un file da inviare");
      return;
    }
    if (user.role === "TRAINER" && !recipientId) {
      toast.error("Seleziona un allievo destinatario");
      return;
    }
    setSending(true);
    try {
      let res: Response;
      if (DIRECT_UPLOAD) {
        const { key, sizeBytes, mimeType } = await uploadFileDirect(file, `media/${user.id}`);
        res = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            sizeBytes,
            mimeType,
            context,
            note: note || undefined,
            recipientId: recipientId || undefined,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("context", context);
        if (note) formData.append("note", note);
        if (recipientId) formData.append("recipientId", recipientId);
        res = await fetch("/api/media", { method: "POST", body: formData });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Inviato con successo");
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
      onSent();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Errore durante l'invio");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImagePlus size={16} /> Invia foto o video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {user.role === "TRAINER" && (
          <Select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
            <option value="">Seleziona allievo destinatario...</option>
            {students.map((s) => (
              <option key={s.studentId} value={s.studentId}>
                {s.profile?.displayName ?? s.studentId}
              </option>
            ))}
          </Select>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
        <Select value={context} onChange={(e) => setContext(e.target.value)}>
          <option value="GENERAL">Comunicazione generale</option>
          <option value="PHYSICAL_UPDATE">Aggiornamento fisico</option>
          <option value="SESSION">Allenamento</option>
          <option value="EXERCISE">Esercizio specifico</option>
        </Select>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Aggiungi una nota (opzionale)" />
        <Button type="button" onClick={send} loading={sending}>
          <Send size={15} /> Invia
        </Button>
      </CardContent>
    </Card>
  );
}
