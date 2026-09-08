"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Trophy, Activity, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

interface AnalyticsData {
  summary: {
    totalSessions: number;
    totalVolume: number;
    volumeChangePct: number;
    trend: "in_crescita" | "in_calo" | "stabile";
    avgSessionsPerWeek: number;
    recentPRCount: number;
  };
  volumeByDate: Array<{ date: string; volume: number; sets: number; reps: number }>;
  volumeByMuscleGroup: Array<{ muscleGroup: string; volume: number }>;
  e1rmProgression: Array<{ date: string; weightKg: number; reps: number; e1rm: number }>;
  targetExercise: string | null;
  availableExercises: string[];
  personalRecords: Array<{ id: string; exerciseName: string; weightKg: number; reps: number; achievedAt: string }>;
  bodyMeasurements: Array<{ id: string; weightKg: number | null; recordedAt: string }>;
  fatigueEntries: Array<{ id: string; fatigue: number | null; energy: number | null; recovery: number | null; recordedAt: string }>;
}

const PERIODS = [
  { value: "7", label: "Ultimi 7 giorni" },
  { value: "30", label: "Ultimi 30 giorni" },
  { value: "90", label: "Ultimi 90 giorni" },
  { value: "all", label: "Tutto il periodo" },
];

const CHART_COLOR = "#16a34a";
const CHART_COLOR_2 = "#ff5a1f";

export function AthleteAnalytics({ studentId }: { studentId: string }) {
  const [period, setPeriod] = useState("30");
  const [exercise, setExercise] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ period });
    if (exercise) qs.set("exercise", exercise);
    fetch(`/api/analytics/${studentId}?${qs.toString()}`)
      .then((r) => r.json())
      .then(setData);
  }, [studentId, period, exercise]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 sm:flex">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={16} /> Analisi e progressi
        </CardTitle>
        <div className="flex gap-2">
          {data && data.availableExercises.length > 0 && (
            <Select
              value={exercise || data.targetExercise || ""}
              onChange={(e) => setExercise(e.target.value)}
              className="w-auto text-xs"
            >
              {data.availableExercises.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </Select>
          )}
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-auto text-xs">
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!data && <Skeleton className="h-64" />}

        {data && data.summary.totalSessions === 0 && (
          <EmptyState
            icon={<Activity size={28} />}
            title="Ancora nessun dato"
            description="I grafici appariranno non appena verranno completati i primi allenamenti."
          />
        )}

        {data && data.summary.totalSessions > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Allenamenti" value={String(data.summary.totalSessions)} />
              <StatTile label="Volume totale" value={`${data.summary.totalVolume.toLocaleString("it-IT")} kg`} />
              <StatTile
                label="Trend"
                value={
                  data.summary.trend === "in_crescita"
                    ? "In crescita"
                    : data.summary.trend === "in_calo"
                      ? "In calo"
                      : "Stabile"
                }
                icon={
                  data.summary.trend === "in_crescita" ? (
                    <TrendingUp size={14} className="text-primary" />
                  ) : data.summary.trend === "in_calo" ? (
                    <TrendingDown size={14} className="text-danger" />
                  ) : (
                    <Minus size={14} className="text-muted-foreground" />
                  )
                }
                sub={`${data.summary.volumeChangePct > 0 ? "+" : ""}${data.summary.volumeChangePct}% vs periodo precedente`}
              />
              <StatTile label="Nuovi record" value={String(data.summary.recentPRCount)} icon={<Trophy size={14} className="text-accent" />} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Volume di allenamento nel tempo</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.volumeByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="volume" stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3 }} name="Volume (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {data.e1rmProgression.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">
                  Progressione e1RM stimato — {exercise || data.targetExercise}
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.e1rmProgression}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="e1rm" stroke={CHART_COLOR_2} strokeWidth={2} dot={{ r: 3 }} name="e1RM (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.volumeByMuscleGroup.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Distribuzione volume per gruppo muscolare</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.volumeByMuscleGroup}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="muscleGroup" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="volume" fill={CHART_COLOR} radius={[4, 4, 0, 0]} name="Volume (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.bodyMeasurements.length > 1 && (
              <div>
                <p className="mb-2 text-sm font-medium">Peso corporeo</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={data.bodyMeasurements.map((m) => ({
                      date: m.recordedAt.slice(0, 10),
                      weight: m.weightKg,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="weight" stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3 }} name="Peso (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.fatigueEntries.length > 1 && (
              <div>
                <p className="mb-2 text-sm font-medium">Fatica, energia e recupero</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={data.fatigueEntries.map((f) => ({
                      date: f.recordedAt.slice(0, 10),
                      fatica: f.fatigue,
                      energia: f.energy,
                      recupero: f.recovery,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="fatica" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="energia" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="recupero" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 flex items-center gap-1 text-lg font-bold")}>
        {icon}
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
