import { cn } from "@/lib/utils";

export type StatusTone = "cyan" | "magenta" | "violet" | "rose" | "muted";

const TONE_CLASS: Record<StatusTone, string> = {
  cyan: "bg-accent-cyan shadow-glow-cyan",
  magenta: "bg-accent-magenta shadow-glow-magenta",
  violet: "bg-accent-violet",
  rose: "bg-accent-rose",
  muted: "bg-text-muted",
};

interface StatusDotProps {
  /** Visual tone of the dot. Defaults to "cyan" (active/idle). */
  tone?: StatusTone;
  /** Optional accessible label; falls back to a generic "status". */
  label?: string;
  /** Show the dot with a soft pulsing animation. */
  pulse?: boolean;
  className?: string;
}

/**
 * Small status indicator pill. The dot uses an accent color (cyan by default)
 * and may pulse to signal "active" or "live" state. Magenta is reserved for
 * critical risk indicators per the project's neon-accent discipline.
 */
export function StatusDot({
  tone = "cyan",
  label = "status",
  pulse = false,
  className,
}: StatusDotProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        TONE_CLASS[tone],
        pulse && "animate-pulse",
        className,
      )}
    />
  );
}
