"use client";

import { useMemo } from "react";
import { AffectedFileList } from "@/components/cards/AffectedFileList";
import { RecommendationList } from "@/components/cards/RecommendationList";
import { RiskBadge } from "@/components/cards/RiskBadge";
import { ModuleSelect, type ModuleSelectOption } from "@/components/controls/ModuleSelect";
import { useRepoSelection } from "@/lib/state/selection";
import { getDependencies } from "@/lib/mock/dependencies";
import { getImpact } from "@/lib/mock/impact";
import { DEFAULT_REPO_ID } from "@/lib/mock/repos";
import { findDepNode } from "@/lib/mock/graphMap";
import type { DepGraph, DepNode, ImpactReport } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Impact Analysis panel (AC-7 + AC-8).
 *
 * Branches on the URL-synced `?repo=` and `?module=`:
 * - no repo        → "awaiting" placeholder
 * - unknown repo   → "not in catalog" placeholder
 * - no module      → "select a module" empty state with a hint pointing
 *                    at the Dependency Graph
 * - unknown module → rose-tinted "module not in catalog" warning
 * - known module   → the full AC-8 panel: risk badge, blast-radius
 *                    + transitively-affected stat cards, sorted
 *                    affected-file list (top 20 + show all), and
 *                    a numbered list of 3-5 recommendations.
 *
 * The panel header holds a `ModuleSelect` combobox (AC-7): choosing a
 * module from the list calls `setModule(id)` and writes
 * `?module=<id>` to the URL, which is the same source of truth that
 * the Dependency Graph's `onNodeClick` and the Architecture Map's
 * selected-node computation read.
 */
export function ImpactAnalysis() {
  const { repoId, moduleId } = useRepoSelection();
  const graph = getDependencies(repoId);

  if (graph === undefined) {
    if (repoId === null) {
      return <AwaitingState />;
    }
    return <UnknownRepoState repoId={repoId} />;
  }

  if (moduleId === null) {
    return <NoModuleState graph={graph} />;
  }

  const selected = findDepNode(graph, moduleId);
  if (selected === undefined) {
    return <UnknownModuleState graph={graph} moduleId={moduleId} />;
  }

  const impact = getImpact(repoId, moduleId);
  if (impact === undefined) {
    // The module is in the dep graph but missing from the impact
    // catalog — should never happen in the seeded demo, but
    // defending against it keeps the panel from throwing.
    return <UnknownModuleState graph={graph} moduleId={moduleId} />;
  }

  return <LoadedState graph={graph} module={selected} impact={impact} />;
}

// ── Awaiting (no repo) ───────────────────────────────────────────────────

function AwaitingState() {
  return (
    <section
      aria-label="Awaiting impact analysis"
      className="rounded-lg border border-dashed border-border-subtle bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        05 · Impact Analysis
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">no repository loaded</span> ·
        impact analysis renders once a repository is selected.
      </p>
    </section>
  );
}

// ── Unknown repo (forward-looking placeholder) ────────────────────────────

function UnknownRepoState({ repoId }: { repoId: string }) {
  return (
    <section
      aria-label="Unknown repository impact"
      className="rounded-lg border border-dashed border-accent-rose/40 bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-rose">
        05 · Impact Analysis · unknown
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">{repoId}</span> has no
        impact catalog in the demo. Try{" "}
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

// ── No module selected ───────────────────────────────────────────────────

function NoModuleState({ graph }: { graph: DepGraph }) {
  return (
    <section
      aria-labelledby="impact-analysis-heading"
      className="rounded-lg border border-border-subtle bg-surface-panel"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-subtle px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          05 · Impact Analysis
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          awaiting selection
        </p>
      </header>

      <div className="space-y-4 p-6">
        <div>
          <h2
            id="impact-analysis-heading"
            className="font-mono text-base text-text-primary sm:text-lg"
          >
            What breaks if this module changes?
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-text-muted">
            Pick a module from the Dependency Graph above (click a node)
            or use the combobox below to choose one. We&apos;ll surface
            the blast radius, transitively affected files, and a short
            list of recommendations.
          </p>
        </div>

        <ModulePickerPanel graph={graph} />

        <EmptyHint />
      </div>
    </section>
  );
}

// ── Unknown module id (e.g. typed by hand) ───────────────────────────────

function UnknownModuleState({
  graph,
  moduleId,
}: {
  graph: DepGraph;
  moduleId: string;
}) {
  return (
    <section
      aria-label="Unknown module"
      className="rounded-lg border border-dashed border-accent-rose/40 bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-rose">
        05 · Impact Analysis · unknown module
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">{moduleId}</span> is
        not in this repository&apos;s dependency graph. Pick a module
        from the combobox below or click a node in the Dependency
        Graph.
      </p>

      <div className="mt-4">
        <ModulePickerPanel graph={graph} />
      </div>
    </section>
  );
}

// ── Loaded: real panel ───────────────────────────────────────────────────

function LoadedState({
  graph,
  module,
  impact,
}: {
  graph: DepGraph;
  module: DepNode;
  impact: ImpactReport;
}) {
  return (
    <section
      aria-labelledby="impact-analysis-heading"
      className="rounded-lg border border-border-subtle bg-surface-panel"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border-subtle px-6 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
            05 · Impact Analysis
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-accent-cyan">
            selected · {module.id}
          </p>
        </div>
        <ModulePickerPanel graph={graph} />
      </header>

      <div className="space-y-5 p-6">
        <div>
          <h2
            id="impact-analysis-heading"
            className="flex flex-wrap items-center gap-3 font-mono text-base text-text-primary sm:text-lg"
          >
            <span>
              What breaks if{" "}
              <code className="text-accent-cyan">{module.label}</code> changes?
            </span>
            <RiskBadge level={impact.risk} size="lg" />
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            The selected module is in the <em>{module.layer}</em> layer
            with {module.files} source files, {module.inCount} inbound
            and {module.outCount} outbound dependencies. The
            blast-radius and transitively-affected counts below are
            derived from the dependency graph.
          </p>
        </div>

        <ImpactStats
          directCount={impact.direct.length}
          transitiveCount={impact.transitive.length}
        />

        <AffectedFileList files={impact.transitive} caption="transitively affected" />

        <RecommendationList items={impact.recommendations} />
      </div>
    </section>
  );
}

// ── Module combobox wrapper (shared by NoModule / Unknown / Loaded) ────

function ModulePickerPanel({ graph }: { graph: DepGraph }) {
  const { moduleId, setModule } = useRepoSelection();

  const options = useMemo<ReadonlyArray<ModuleSelectOption>>(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        hint: `${n.layer} · in ${n.inCount} · out ${n.outCount}`,
      })),
    [graph.nodes],
  );

  return (
    <div className="min-w-[260px] sm:min-w-[320px]">
      <ModuleSelect
        label="Module"
        value={moduleId}
        options={options}
        onChange={(id) => setModule(id)}
        placeholder={
          options.length === 0
            ? "no modules in this repo"
            : "Select a module…"
        }
      />
    </div>
  );
}

// ── AC-8: blast-radius + transitively-affected stat row ────────────────

/**
 * Two-card stat row that sits between the heading and the affected
 * file list. The two numbers are the headline AC-8 metrics:
 * - Blast radius (directly affected files) = number of files in
 *   the module's *direct* downstream consumers.
 * - Transitively affected = number of files in the full transitive
 *   closure (always >= blast radius, because the closure includes
 *   the direct dependents).
 */
function ImpactStats({
  directCount,
  transitiveCount,
}: {
  directCount: number;
  transitiveCount: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <StatCard
        label="Blast radius"
        value={directCount}
        unit="files"
        hint="in modules that directly import this one"
        tone="cyan"
      />
      <StatCard
        label="Transitively affected"
        value={transitiveCount}
        unit="files"
        hint="in the full downstream closure"
        tone="magenta"
      />
    </div>
  );
}

type StatTone = "cyan" | "magenta";

const STAT_TONE: Record<StatTone, string> = {
  cyan: "text-accent-cyan",
  magenta: "text-accent-magenta",
};

function StatCard({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  hint?: string;
  tone: StatTone;
}) {
  return (
    <div className="rounded border border-border-subtle bg-surface-raised/60 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-2">
        <span
          className={cn(
            "font-mono text-3xl font-semibold tabular-nums",
            STAT_TONE[tone],
          )}
        >
          {value.toLocaleString("en-US")}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
          {unit}
        </span>
      </p>
      {hint ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ── Empty-state hint ─────────────────────────────────────────────────────

function EmptyHint() {
  return (
    <div className="rounded-md border border-dashed border-border-subtle bg-surface-base/40 p-4 text-sm text-text-muted">
      <p>
        No module selected. Either pick one from the combobox above or
        click a node in the Dependency Graph. Selection lives in the
        URL as <code className="font-mono text-accent-cyan">?module=&lt;id&gt;</code>{" "}
        so the same state is shareable across tabs and reloads.
      </p>
    </div>
  );
}
