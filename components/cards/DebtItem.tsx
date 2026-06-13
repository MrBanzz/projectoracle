import type { DebtItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Single tech-debt item card (AC-9).
 *
 * Renders the four spec fields in a compact, monospaced rhythm:
 * - title (the headline)
 * - category (one of the five AC-9 buckets)
 * - severity (LOW / MEDIUM / HIGH with risk-palette color)
 * - one-line description
 *
 * The severity chip reuses the same color tokens as the AC-8
 * `RiskBadge` so the panel reads as one design system.
 */

interface DebtItemCardProps {
  item: DebtItem;
}

const SEVERITY_TONE: Record<DebtItem["severity"], string> = {
  LOW: "text-risk-low",
  MEDIUM: "text-risk-medium",
  HIGH: "text-risk-high",
};

const SEVERITY_BG: Record<DebtItem["severity"], string> = {
  LOW: "bg-risk-low/10 border-risk-low/30",
  MEDIUM: "bg-risk-medium/10 border-risk-medium/30",
  HIGH: "bg-risk-high/10 border-risk-high/30",
};

const CATEGORY_LABEL: Record<DebtItem["category"], string> = {
  Complexity: "complexity",
  Duplication: "duplication",
  Coverage: "coverage",
  "Outdated Deps": "outdated deps",
  Security: "security",
};

export function DebtItemCard({ item }: DebtItemCardProps) {
  return (
    <article
      className="rounded border border-border-subtle bg-surface-raised/40 p-4"
      aria-label={`${item.severity} severity: ${item.title}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-mono text-sm font-semibold text-text-primary">
          {item.title}
        </h3>
        <span
          className={cn(
            "inline-flex items-center rounded-sm border px-1.5 py-0.5",
            "font-mono text-[10px] uppercase tracking-[0.22em]",
            SEVERITY_BG[item.severity],
            SEVERITY_TONE[item.severity],
          )}
        >
          {item.severity}
        </span>
      </div>

      <p className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        <span className="text-accent-cyan">{CATEGORY_LABEL[item.category]}</span>
      </p>

      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        {item.description}
      </p>
    </article>
  );
}
