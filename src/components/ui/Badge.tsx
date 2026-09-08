import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "primary" | "accent" | "danger" | "warning" | "outline";

const classes: Record<Variant, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/15 text-accent",
  danger: "bg-danger/15 text-danger",
  warning: "bg-warning/15 text-warning",
  outline: "border border-border text-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        classes[variant],
        className
      )}
      {...props}
    />
  );
}
