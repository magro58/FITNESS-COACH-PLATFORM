"use client";

import { useEffect, useState } from "react";
import { Link2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface StudentOption {
  studentId: string;
  profile: { displayName: string } | null;
}

export function LinkComposer({ onSent }: { onSent: () => void }) {
  const toast = useToast();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []));
  }, []);

  async function send() {
    if (!recipientId || !url) {
      toast.error("Compila destinatario e URL");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, url, title: title || null, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Link inviato");
      setUrl("");
      setTitle("");
      setNote("");
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
          <Link2 size={16} /> Invia link (es. YouTube, articoli)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
          <option value="">Seleziona allievo destinatario...</option>
          {students.map((s) => (
            <option key={s.studentId} value={s.studentId}>
              {s.profile?.displayName ?? s.studentId}
            </option>
          ))}
        </Select>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/..." />
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titolo (opzionale)" />
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opzionale)" />
        <Button type="button" onClick={send} loading={sending}>
          <Send size={15} /> Invia link
        </Button>
      </CardContent>
    </Card>
  );
}
