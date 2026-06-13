"use client";

import { useMemo, useState } from "react";
import { DebtItemCard } from "@/components/cards/DebtItem";
import { useRepoSelection } from "@/lib/state/selection";
import { getDebt } from "@/lib/mock/debt";
import { getRepo } from "@/lib/mock/repos";
import type { DebtItem, DebtSeverity } from "@/lib/types";

/**
 * Tech Debt Summary panel (AC-9).
 *
 * Renders the top 5 debt items for the URL-synced `?repo=`, with a
 * severity-sorted header that toggles the sort order. The default
 * order is HIGH → MEDIUM → LOW (severity descending), as the AC-9
 * success signal requires.
 *
 * Branches:
 * - no repo        → "awaiting" placeholder
 * - unknown repo   → "not in catalog" placeholder
 * - known repo     → full panel with 5 cards + sortable header
 */

const SEVERITY_RANK: Record<DebtSeverity, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

type SortOrder = "desc" | "asc";

export function TechDebtSummary() {
  const { repoId } = useRepoSelection();
  const repo = getRepo(repoId);
  const items = getDebt(repoId);
  const [order, setOrder] = useState<SortOrder>("desc");

  const sorted = useMemo(
    () => sortBySeverity(items, order),
    [items, order],
  );

  if (repo === undefined) {
    if (repoId === null) {
      return <AwaitingState />;
    }
    return <UnknownRepoState repoId={repoId} />;
  }

  return (
    <section
      aria-labelledby="tech-debt-heading"
      className="rounded-lg border border-border-subtle bg-surface-panel"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-subtle px-6 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
            06 · Tech Debt Summary
          </p>
          <h2
            id="tech-debt-heading"
            className="mt-1 font-mono text-base text-text-primary sm:text-lg"
          >
            Top {items.length} debt items · {repo.fullName}
          </h2>
        </div>
        <SortToggle order={order} onChange={setOrder} />
      </header>

      <div className="grid grid-cols-1 gap-3 p-6 lg:grid-cols-2">
        {sorted.map((item) => (
          <DebtItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

// ── Sort helpers ──────────────────────────────────────────────────────────

function sortBySeverity(
  items: ReadonlyArray<DebtItem>,
  order: SortOrder,
): ReadonlyArray<DebtItem> {
  const sign = order === "desc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const diff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (diff !== 0) return sign * diff;
    // Stable tiebreaker: keep the catalog order by id.
    return a.id.localeCompare(b.id);
  });
}

function SortToggle({
  order,
  onChange,
}: {
  order: SortOrder;
  onChange: (next: SortOrder) => void;
}) {
  const next: SortOrder = order === "desc" ? "asc" : "desc";
  const label = order === "desc" ? "severity: high → low" : "severity: low → high";
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      className="inline-flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-base/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted transition-colors hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
      aria-label={`Sort by severity, currently ${label}. Click to switch to ${next === "desc" ? "high to low" : "low to high"}.`}
    >
      <span>{label}</span>
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={order === "desc" ? "h-3 w-3" : "h-3 w-3 rotate-180"}
      >
        <path d="M3 5l3 3 3-3" />
      </svg>
    </button>
  );
}

// ── Empty / unknown states (match the other panels' rhythm) ──────────────

function AwaitingState() {
  return (
    <section
      aria-label="Awaiting tech debt summary"
      className="rounded-lg border border-dashed border-border-subtle bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        06 · Tech Debt Summary
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">no repository loaded</span> ·
        the top 5 debt items render once a repository is selected.
      </p>
    </section>
  );
}

function UnknownRepoState({ repoId }: { repoId: string }) {
  return (
    <section
      aria-label="Unknown repository tech debt"
      className="rounded-lg border border-dashed border-accent-rose/40 bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-rose">
        06 · Tech Debt Summary · unknown
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">{repoId}</span> has no
        debt catalog in the demo. Use a seeded sample to see the summary.
      </p>
    </section>
  );
}
