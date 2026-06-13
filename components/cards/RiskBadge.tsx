import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Color-coded risk badge used by the AC-8 Impact Analysis panel.
 *
 * The four risk levels map to the project's risk palette in
 * `tailwind.config.ts`:
 * - LOW      → risk.low      = #22d3ee (cyan)
 * - MEDIUM   → risk.medium   = #a78bfa (violet)
 * - HIGH     → risk.high     = #f0abfc (magenta)
 * - CRITICAL → risk.critical = #fb7185 (rose)
 *
 * The badge is a compact pill with a leading dot + uppercase label,
 * sized to fit into a panel header / stat row without breaking the
 * HUD-style monospaced rhythm of the rest of the chrome.
 *
 * The risk palette is one of the few places the project *intentionally*
 * uses a saturated accent on a static (non-interactive) data element;
 * the panel reads the badge as a *signal*, not as decoration, so the
 * loud color is the point.
 */

interface RiskBadgeProps {
  /** The risk level to display. */
  level: RiskLevel;
  /** Optional size variant. "lg" makes the badge taller/wider for a panel header. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TONE: Record<
  RiskLevel,
  { dot: string; text: string; ring: string; label: string }
> = {
  LOW: {
    dot: "bg-risk-low",
    text: "text-risk-low",
    ring: "ring-risk-low/40",
    label: "LOW",
  },
  MEDIUM: {
    dot: "bg-risk-medium",
    text: "text-risk-medium",
    ring: "ring-risk-medium/40",
    label: "MEDIUM",
  },
  HIGH: {
    dot: "bg-risk-high",
    text: "text-risk-high",
    ring: "ring-risk-high/40",
    label: "HIGH",
  },
  CRITICAL: {
    dot: "bg-risk-critical",
    text: "text-risk-critical",
    ring: "ring-risk-critical/40",
    label: "CRITICAL",
  },
};

const SIZE: Record<NonNullable<RiskBadgeProps["size"]>, string> = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1",
  md: "px-2 py-1 text-[11px] gap-1.5",
  lg: "px-3 py-1.5 text-xs gap-2",
};

const DOT_SIZE: Record<NonNullable<RiskBadgeProps["size"]>, string> = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
};

export function RiskBadge({ level, size = "md", className }: RiskBadgeProps) {
  const tone = TONE[level];
  return (
    <span
      role="status"
      aria-label={`Risk: ${tone.label}`}
      className={cn(
        "inline-flex items-center rounded-sm border font-mono uppercase tracking-[0.22em]",
        // Use the tone's text color on a desaturated surface, with a
        // subtle ring matching the risk color so the badge reads as a
        // pill rather than a flat chip.
        tone.text,
        "border-current/30 bg-surface-base ring-1",
        tone.ring,
        SIZE[size],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("inline-block shrink-0 rounded-full", tone.dot, DOT_SIZE[size])}
      />
      <span className="font-semibold tabular-nums">{tone.label}</span>
    </span>
  );
}
