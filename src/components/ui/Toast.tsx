"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idCounter;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 4500);
  }, []);

  const value: ToastContextValue = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:top-4">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "animate-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border px-3.5 py-3 text-sm shadow-lg backdrop-blur",
              item.kind === "success" && "border-primary/30 bg-primary/10 text-primary",
              item.kind === "error" && "border-danger/30 bg-danger/10 text-danger",
              item.kind === "info" && "border-border bg-card text-foreground"
            )}
          >
            {item.kind === "success" && <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            {item.kind === "error" && <XCircle size={18} className="mt-0.5 shrink-0" />}
            {item.kind === "info" && <Info size={18} className="mt-0.5 shrink-0" />}
            <span className="flex-1">{item.message}</span>
            <button
              onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Chiudi"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
