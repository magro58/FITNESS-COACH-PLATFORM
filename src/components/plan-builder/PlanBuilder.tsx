"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Copy, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { DayEditor } from "./DayEditor";
import { cn } from "@/lib/cn";
import { emptyDay, emptyPlan, clientId, type BuilderPlan, type BuilderDay } from "@/lib/plan-builder-types";

interface StudentOption {
  studentId: string;
  profile: { displayName: string } | null;
}

export function PlanBuilder({
  mode,
  planId,
  initialPlan,
  currentVersionNumber,
  isAssigned,
  preselectStudentId,
}: {
  mode: "create" | "edit";
  planId?: string;
  initialPlan?: BuilderPlan;
  currentVersionNumber?: number;
  isAssigned?: boolean;
  preselectStudentId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [plan, setPlan] = useState<BuilderPlan>(
    initialPlan ?? { ...emptyPlan(), studentId: preselectStudentId ?? null }
  );
  const [version, setVersion] = useState(currentVersionNumber);
  const [assigned, setAssigned] = useState(isAssigned);
  const [activeDay, setActiveDay] = useState(0);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []));
  }, []);

  function updateDay(index: number, day: BuilderDay) {
    setPlan((p) => ({ ...p, days: p.days.map((d, i) => (i === index ? day : d)) }));
  }

  function addDay() {
    setPlan((p) => ({ ...p, days: [...p.days, emptyDay(p.days.length)] }));
    setActiveDay(plan.days.length);
  }

  function duplicateDay(index: number) {
    const source = plan.days[index];
    const copy: BuilderDay = {
      ...source,
      clientId: clientId("day"),
      id: undefined,
      name: `${source.name} (copia)`,
      exercises: source.exercises.map((e) => ({ ...e, clientId: clientId("ex"), id: undefined })),
    };
    setPlan((p) => ({ ...p, days: [...p.days.slice(0, index + 1), copy, ...p.days.slice(index + 1)] }));
  }

  function deleteDay(index: number) {
    if (plan.days.length <= 1) {
      toast.error("La scheda deve avere almeno una giornata");
      return;
    }
    setPlan((p) => ({ ...p, days: p.days.filter((_, i) => i !== index) }));
    setActiveDay((a) => Math.max(0, a - (index <= a ? 1 : 0)));
  }

  async function save() {
    if (!plan.name.trim()) {
      toast.error("Inserisci un nome per la scheda");
      return;
    }
    if (plan.days.some((d) => !d.name.trim())) {
      toast.error("Ogni giornata deve avere un nome");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: plan.name,
        description: plan.description || null,
        goal: plan.goal || null,
        startDate: plan.startDate || null,
        endDate: plan.endDate || null,
        notes: plan.notes || null,
        isTemplate: plan.isTemplate,
        studentId: plan.studentId || null,
        days: plan.days.map((d, dIdx) => ({
          name: d.name,
          orderIndex: dIdx,
          notes: d.notes || null,
          exercises: d.exercises.map((e, eIdx) => ({ ...e, orderIndex: eIdx })),
        })),
      };

      const res = await fetch(mode === "create" ? "/api/plans" : `/api/plans/${planId}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(mode === "create" ? "Scheda creata" : "Scheda aggiornata");
      if (mode === "create") {
        router.push(`/plans/${data.plan.id}`);
      } else {
        setVersion(data.versionNumber ?? data.plan.currentVersionNumber);
        setAssigned(!!data.plan.studentId);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  async function duplicatePlan() {
    if (!planId) return;
    const res = await fetch(`/api/plans/${planId}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Scheda duplicata");
      router.push(`/plans/${data.plan.id}`);
    } else {
      toast.error("Errore durante la duplicazione");
    }
  }

  async function deletePlan() {
    if (!planId) return;
    if (!confirm("Eliminare definitivamente questa scheda?")) return;
    const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Scheda eliminata");
      router.push("/plans");
    } else {
      toast.error("Errore durante l'eliminazione");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <Input
            value={plan.name}
            onChange={(e) => setPlan((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nome scheda (es. Forza 4 giorni)"
            className="border-none bg-transparent px-0 text-xl font-bold shadow-none focus:ring-0"
          />
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {version && <Badge variant="outline">v{version}</Badge>}
            {assigned && <Badge variant="primary">Assegnata</Badge>}
            {plan.isTemplate && <Badge variant="accent">Template</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "edit" && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={duplicatePlan}>
                <Copy size={14} /> Duplica
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={deletePlan}>
                <Trash2 size={14} /> Elimina
              </Button>
            </>
          )}
          <Button type="button" onClick={save} loading={saving}>
            <Save size={15} /> Salva scheda
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Obiettivo</Label>
            <Input
              value={plan.goal}
              onChange={(e) => setPlan((p) => ({ ...p, goal: e.target.value }))}
              placeholder="Es. Ipertrofia, forza, dimagrimento..."
            />
          </div>
          <div>
            <Label className="text-xs">Assegna ad allievo</Label>
            <Select
              value={plan.studentId ?? ""}
              onChange={(e) => setPlan((p) => ({ ...p, studentId: e.target.value || null }))}
            >
              <option value="">Nessuno (bozza / template)</option>
              {students.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.profile?.displayName ?? s.studentId}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="text-xs">Data inizio</Label>
            <Input
              type="date"
              value={plan.startDate}
              onChange={(e) => setPlan((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Data fine</Label>
            <Input
              type="date"
              value={plan.endDate}
              onChange={(e) => setPlan((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Descrizione</Label>
            <Textarea
              value={plan.description}
              onChange={(e) => setPlan((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Note generali</Label>
            <Textarea value={plan.notes} onChange={(e) => setPlan((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={plan.isTemplate}
              onChange={(e) => setPlan((p) => ({ ...p, isTemplate: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Salva come template riutilizzabile
          </label>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {plan.days.map((day, i) => (
            <button
              key={day.clientId}
              type="button"
              onClick={() => setActiveDay(i)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                i === activeDay
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {day.name}
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addDay}>
            <Plus size={14} /> Giornata
          </Button>
        </div>

        {plan.days[activeDay] && (
          <Card>
            <CardContent className="pt-5">
              <div className="mb-3 flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => duplicateDay(activeDay)}>
                  <Copy size={13} /> Duplica giornata
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteDay(activeDay)}>
                  <Trash2 size={13} /> Elimina giornata
                </Button>
              </div>
              <DayEditor day={plan.days[activeDay]} onChange={(d) => updateDay(activeDay, d)} />
            </CardContent>
          </Card>
        )}
      </div>

      {mode === "edit" && planId && (
        <a
          href={`/plans/${planId}/history`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <History size={14} /> Visualizza storico versioni
        </a>
      )}
    </div>
  );
}
