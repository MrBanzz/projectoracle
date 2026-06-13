"use client";

import { useMemo } from "react";
import { useRepoSelection } from "@/lib/state/selection";
import { DEFAULT_REPO_ID, getRepo } from "@/lib/mock/repos";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { languageColor } from "@/lib/palette";
import type { HealthDeltas, RepoData, RepoLanguage } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Repository overview panel. Branches on the URL-synced `?repo=`:
 * - no repo       → "awaiting" empty state
 * - unknown repo  → "not in catalog" placeholder (forward-looking; AC-10
 *                   will replace this with a richer empty state + fallback
 *                   button)
 * - known repo    → full overview panel
 *
 * Every numeric value in the loaded state is sourced from
 * `lib/mock/repos.ts` — there are no hard-coded numbers in this component.
 */
export function RepoOverview() {
  const { repoId } = useRepoSelection();
  const repo = getRepo(repoId);

  if (repo === undefined) {
    if (repoId === null) {
      return <AwaitingState />;
    }
    return <UnknownRepoState repoId={repoId} />;
  }

  return <LoadedState repo={repo} />;
}

// ── Awaiting (no repo) ───────────────────────────────────────────────────

function AwaitingState() {
  return (
    <section
      aria-label="Awaiting repository"
      className="rounded-lg border border-dashed border-border-subtle bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        02 · Repository
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">no repository loaded</span> ·
        enter a GitHub URL above to render the architecture map, dependency
        graph, and impact analysis.
      </p>
    </section>
  );
}

// ── Unknown repo (forward-looking placeholder) ────────────────────────────

function UnknownRepoState({ repoId }: { repoId: string }) {
  return (
    <section
      aria-label="Unknown repository"
      className="rounded-lg border border-dashed border-accent-rose/40 bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-rose">
        02 · Repository · unknown
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">{repoId}</span> is not in
        the demo catalog. Try{" "}
        <a
          href={`/?repo=${DEFAULT_REPO_ID}`}
          className="font-mono text-accent-cyan underline decoration-accent-cyan/40 underline-offset-2 hover:decoration-accent-cyan"
        >
          ?repo={DEFAULT_REPO_ID}
        </a>{" "}
        for a seeded sample.
      </p>
    </section>
  );
}

// ── Loaded (real panel) ───────────────────────────────────────────────────

function LoadedState({ repo }: { repo: RepoData }) {
  const primary = repo.languages[0];
  const analyzedLabel = formatRelativeTime(repo.analyzedAt);

  return (
    <section
      aria-labelledby="repo-overview-heading"
      className="rounded-lg border border-border-subtle bg-surface-panel"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-subtle px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          02 · Repository
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          analyzed ·{" "}
          <time
            dateTime={repo.analyzedAt}
            title={repo.analyzedAt}
            className="text-text-muted"
          >
            {analyzedLabel}
          </time>
        </p>
      </header>

      <div className="space-y-6 p-6">
        <div>
          <h2
            id="repo-overview-heading"
            className="font-mono text-base text-text-primary sm:text-lg"
          >
            {repo.fullName}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-text-muted">
            {repo.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCell
            label="Primary language"
            value={primary ? primary.name : "—"}
            hint={primary ? `${primary.pct}%` : undefined}
          />
          <StatCell
            label="Total files"
            value={formatCount(repo.totals.files)}
          />
          <StatCell
            label="Total modules"
            value={formatCount(repo.totals.modules)}
          />
          <StatCell
            label="Last analyzed"
            value={analyzedLabel}
            hint={repo.analyzedAt.slice(0, 10)}
          />
        </div>

        <LanguageBar languages={repo.languages} />
        <HealthRow health={repo.health} />
      </div>
    </section>
  );
}

// ── Stat cell ────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded border border-border-subtle bg-surface-raised/60 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-text-primary">{value}</p>
      {hint ? (
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ── Language bar ─────────────────────────────────────────────────────────

function LanguageBar({ languages }: { languages: RepoLanguage[] }) {
  const totalPct = useMemo(
    () => languages.reduce((acc, l) => acc + l.pct, 0),
    [languages],
  );

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          Language breakdown
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          {totalPct}% accounted
        </p>
      </div>

      {/* Stacked bar */}
      <div
        role="img"
        aria-label={`Language breakdown: ${languages
          .map((l) => `${l.name} ${l.pct}%`)
          .join(", ")}`}
        className="mt-2 flex h-2 w-full overflow-hidden rounded border border-border-subtle bg-surface-base"
      >
        {languages.map((lang) => (
          <span
            key={lang.name}
            title={`${lang.name} · ${lang.pct}%`}
            style={{
              width: `${lang.pct}%`,
              backgroundColor: languageColor(lang.name),
            }}
            className="h-full first:rounded-l last:rounded-r"
          />
        ))}
      </div>

      {/* Legend */}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {languages.map((lang) => (
          <li
            key={lang.name}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted"
          >
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-sm"
              style={{ backgroundColor: languageColor(lang.name) }}
            />
            <span>{lang.name}</span>
            <span className="text-text-dim">{lang.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Health row ───────────────────────────────────────────────────────────

type MetricKey = keyof HealthDeltas;
type Direction = "higher-is-better" | "lower-is-better";

const HEALTH_METRICS: ReadonlyArray<{
  key: MetricKey;
  label: string;
  direction: Direction;
}> = [
  { key: "score", label: "Health Score", direction: "higher-is-better" },
  { key: "complexity", label: "Avg Complexity", direction: "lower-is-better" },
  { key: "debtIndex", label: "Tech Debt Index", direction: "lower-is-better" },
  { key: "coverage", label: "Test Coverage", direction: "higher-is-better" },
];

function HealthRow({
  health,
}: {
  health: RepoData["health"];
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        Health
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {HEALTH_METRICS.map(({ key, label, direction }) => (
          <HealthCard
            key={key}
            label={label}
            value={health[key]}
            delta={health.deltas[key]}
            direction={direction}
          />
        ))}
      </div>
    </div>
  );
}

function HealthCard({
  label,
  value,
  delta,
  direction,
}: {
  label: string;
  value: number;
  delta: number;
  direction: Direction;
}) {
  const tone = deltaTone(delta, direction);
  return (
    <div className="rounded border border-border-subtle bg-surface-raised/60 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums text-text-primary">
          {value}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
          / 100
        </span>
      </div>
      <DeltaBadge delta={delta} tone={tone} />
    </div>
  );
}

type DeltaTone = "good" | "bad" | "neutral";

function deltaTone(value: number, direction: Direction): DeltaTone {
  if (value === 0) return "neutral";
  const isPositive = value > 0;
  const isGood = direction === "higher-is-better" ? isPositive : !isPositive;
  return isGood ? "good" : "bad";
}

const TONE_CLASS: Record<DeltaTone, string> = {
  good: "text-accent-cyan",
  bad: "text-accent-rose",
  neutral: "text-text-muted",
};

function DeltaBadge({
  delta,
  tone,
}: {
  delta: number;
  tone: DeltaTone;
}) {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  const magnitude = Math.abs(delta);
  const Arrow =
    delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : ArrowFlat;
  const aria = `${sign}${magnitude} points · ${
    tone === "good" ? "improving" : tone === "bad" ? "regressing" : "no change"
  }`;

  return (
    <p
      aria-label={aria}
      className={cn(
        "mt-2 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em]",
        TONE_CLASS[tone],
      )}
    >
      <Arrow />
      <span className="tabular-nums">
        {sign}
        {magnitude}
      </span>
      <span className="text-text-dim">pts vs last</span>
    </p>
  );
}

function ArrowUp() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M6 10V2M2 6l4-4 4 4" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M6 2v8M2 6l4 4 4-4" />
    </svg>
  );
}

function ArrowFlat() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M2 6h8" />
    </svg>
  );
}
