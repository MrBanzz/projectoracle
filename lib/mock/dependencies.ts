import type { DepEdge, DepGraph, DepNode } from "@/lib/types";

/**
 * Hand-laid, per-repo internal-module dependency graph for AC-6.
 *
 * The dep graph is intentionally finer-grained than the AC-5 architecture
 * map: where AC-5 collapses a repository into ~10 architectural layers
 * (apps/web, services/payments, …), AC-6 zooms in to the individual
 * modules inside those layers (apps/web/pages/checkout,
 * services/payments/processor, …). The dep graph is a representative
 * subset of each repo's `totals.modules` count — not the full census.
 *
 * Layout
 * ------
 * Nodes are arranged in a layer-grouped 5-column grid:
 *   - apps           row 0 (and overflow into row 1 if >5)
 *   - services       row 2 (and overflow into row 3 if >5)
 *   - packages       row 4 (and overflow into row 5 if >5)
 *   - infrastructure row 6 (always 1 node, centered)
 *
 * Horizontal spacing is 200 px; vertical spacing is 140 px. The dep
 * node footprint is ~180×60, so adjacent nodes never overlap.
 *
 * In/out counts
 * -------------
 * `inCount` and `outCount` are derived from the seeded edge list (not
 * typed by hand) and exposed on `DepNode` so the AC-6 hover tooltip
 * shows real numbers without re-computing client-side. The
 * `withCounts` helper below is what enforces the invariant
 * "Σ outCount = Σ inCount = |edges|".
 */

const X_COL = [0, 200, 400, 600, 800] as const;
const Y_ROW = 140;
const Y_FIRST = 0;

interface DepNodeSeed {
  id: string;
  files: number;
  layer: DepNode["layer"];
}

/**
 * Re-derive `inCount` / `outCount` from the seeded edge list. This keeps
 * the mock data honest: if someone tweaks an edge list, the tooltip
 * numbers stay in lockstep.
 */
function withCounts(
  seeds: ReadonlyArray<DepNodeSeed>,
  edges: ReadonlyArray<DepEdge>,
): DepNode[] {
  const inById = new Map<string, number>();
  const outById = new Map<string, number>();
  for (const seed of seeds) {
    inById.set(seed.id, 0);
    outById.set(seed.id, 0);
  }
  for (const edge of edges) {
    outById.set(edge.from, (outById.get(edge.from) ?? 0) + 1);
    inById.set(edge.to, (inById.get(edge.to) ?? 0) + 1);
  }
  return seeds.map((seed, index) => ({
    id: seed.id,
    label: seed.id, // label is the module path; kept for forward-compat
    files: seed.files,
    inCount: inById.get(seed.id) ?? 0,
    outCount: outById.get(seed.id) ?? 0,
    layer: seed.layer,
    position: gridPosition(index),
  }));
}

/**
 * Layout nodes in a 5-column, layer-grouped grid. The function is
 * row-aware — it walks the seed list and assigns each node a column
 * index that resets to 0 every 5 entries — so 7 apps, 6 services, 6
 * packages, 1 infra lay out as:
 *   apps       row 0 (5 nodes)  row 1 (2 nodes)
 *   services   row 2 (5 nodes)  row 3 (1 node)
 *   packages   row 4 (5 nodes)  row 5 (1 node)
 *   infra      row 6 (1 node)
 *
 * The grid is intentionally deterministic — the same seed list always
 * produces the same positions, which keeps the demo's screenshots
 * diff-able and avoids hydration-time jank from random layouts.
 */
function gridPosition(index: number): { x: number; y: number } {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return { x: X_COL[col], y: Y_FIRST + row * Y_ROW };
}

// ── acme/payments-platform ───────────────────────────────────────────────

const ACME_SEEDS: ReadonlyArray<DepNodeSeed> = [
  // apps (7) — 5 in row 0, 2 in row 1
  { id: "apps/web/pages/checkout", files: 8, layer: "apps" },
  { id: "apps/web/pages/dashboard", files: 12, layer: "apps" },
  { id: "apps/web/components/CheckoutForm", files: 18, layer: "apps" },
  { id: "apps/web/hooks/useAuth", files: 4, layer: "apps" },
  { id: "apps/api/routes/charges", files: 6, layer: "apps" },
  { id: "apps/api/routes/refunds", files: 5, layer: "apps" },
  { id: "apps/api/middleware/auth", files: 9, layer: "apps" },
  // services (6) — 5 in row 2, 1 in row 3
  { id: "services/payments/processor", files: 32, layer: "services" },
  { id: "services/payments/reconciler", files: 21, layer: "services" },
  { id: "services/auth/oidc", files: 14, layer: "services" },
  { id: "services/auth/sessions", files: 11, layer: "services" },
  { id: "services/ledger/writer", files: 19, layer: "services" },
  { id: "services/ledger/reader", files: 16, layer: "services" },
  // packages (6) — 5 in row 4, 1 in row 5
  { id: "packages/ui/primitives", files: 27, layer: "packages" },
  { id: "packages/ui/forms", files: 23, layer: "packages" },
  { id: "packages/db/postgres", files: 41, layer: "packages" },
  { id: "packages/db/redis", files: 15, layer: "packages" },
  { id: "packages/utils/logger", files: 6, layer: "packages" },
  { id: "packages/utils/errors", files: 4, layer: "packages" },
  // infrastructure (1) — row 6
  { id: "infrastructure/k8s", files: 11, layer: "infrastructure" },
];

const ACME_EDGES: ReadonlyArray<DepEdge> = [
  // apps/web → forms/hooks/services
  { from: "apps/web/pages/checkout", to: "apps/web/components/CheckoutForm" },
  { from: "apps/web/pages/checkout", to: "apps/web/hooks/useAuth" },
  { from: "apps/web/pages/checkout", to: "services/payments/processor" },
  { from: "apps/web/pages/dashboard", to: "services/ledger/reader" },
  { from: "apps/web/pages/dashboard", to: "packages/utils/logger" },
  { from: "apps/web/components/CheckoutForm", to: "packages/ui/forms" },
  { from: "apps/web/components/CheckoutForm", to: "packages/ui/primitives" },
  { from: "apps/web/hooks/useAuth", to: "services/auth/oidc" },
  { from: "apps/web/hooks/useAuth", to: "packages/utils/logger" },
  // apps/api → services/middleware
  { from: "apps/api/routes/charges", to: "services/payments/processor" },
  { from: "apps/api/routes/charges", to: "apps/api/middleware/auth" },
  { from: "apps/api/routes/refunds", to: "services/payments/reconciler" },
  { from: "apps/api/routes/refunds", to: "apps/api/middleware/auth" },
  { from: "apps/api/middleware/auth", to: "services/auth/sessions" },
  { from: "apps/api/middleware/auth", to: "packages/db/redis" },
  // services → packages
  { from: "services/payments/processor", to: "services/ledger/writer" },
  { from: "services/payments/processor", to: "packages/db/postgres" },
  { from: "services/payments/processor", to: "packages/utils/logger" },
  { from: "services/payments/reconciler", to: "services/ledger/reader" },
  { from: "services/payments/reconciler", to: "packages/db/postgres" },
  { from: "services/auth/oidc", to: "packages/db/postgres" },
  { from: "services/auth/oidc", to: "services/auth/sessions" },
  { from: "services/auth/sessions", to: "packages/db/redis" },
  { from: "services/ledger/writer", to: "packages/db/postgres" },
  { from: "services/ledger/writer", to: "packages/utils/logger" },
  { from: "services/ledger/reader", to: "packages/db/postgres" },
  // packages → packages
  { from: "packages/ui/forms", to: "packages/ui/primitives" },
  { from: "packages/ui/forms", to: "packages/utils/errors" },
  { from: "packages/ui/primitives", to: "packages/utils/logger" },
  // packages → infrastructure
  { from: "packages/db/postgres", to: "infrastructure/k8s" },
  { from: "packages/db/redis", to: "infrastructure/k8s" },
];

// ── stellar/orbit-ui ─────────────────────────────────────────────────────

const STELLAR_SEEDS: ReadonlyArray<DepNodeSeed> = [
  // apps (8) — 5 in row 0, 3 in row 1
  { id: "apps/web/components/MetricCard", files: 14, layer: "apps" },
  { id: "apps/web/components/TraceView", files: 22, layer: "apps" },
  { id: "apps/web/components/LogTable", files: 18, layer: "apps" },
  { id: "apps/web/hooks/useMetrics", files: 6, layer: "apps" },
  { id: "apps/ingest/agents/host", files: 11, layer: "apps" },
  { id: "apps/ingest/agents/k8s", files: 13, layer: "apps" },
  { id: "apps/ingest/agents/syslog", files: 9, layer: "apps" },
  { id: "apps/cli/commands/query", files: 7, layer: "apps" },
  // services (6) — 5 in row 2, 1 in row 3
  { id: "services/collector/ingestor", files: 28, layer: "services" },
  { id: "services/collector/buffer", files: 16, layer: "services" },
  { id: "services/query/engine", files: 45, layer: "services" },
  { id: "services/query/cache", files: 19, layer: "services" },
  { id: "services/alerts/evaluator", files: 24, layer: "services" },
  { id: "services/alerts/notifier", files: 12, layer: "services" },
  // packages (3) — 3 in row 4
  { id: "packages/db/timeseries", files: 38, layer: "packages" },
  { id: "packages/db/objectstore", files: 22, layer: "packages" },
  { id: "packages/utils/logger", files: 8, layer: "packages" },
  // infrastructure (1) — row 5
  { id: "infrastructure/observability", files: 9, layer: "infrastructure" },
];

const STELLAR_EDGES: ReadonlyArray<DepEdge> = [
  // apps/web → query/packages
  { from: "apps/web/components/MetricCard", to: "packages/utils/logger" },
  { from: "apps/web/components/MetricCard", to: "services/query/engine" },
  { from: "apps/web/components/TraceView", to: "services/query/engine" },
  { from: "apps/web/components/TraceView", to: "packages/utils/logger" },
  { from: "apps/web/components/LogTable", to: "services/query/cache" },
  { from: "apps/web/hooks/useMetrics", to: "services/query/engine" },
  // apps/ingest → collector/logger
  { from: "apps/ingest/agents/host", to: "services/collector/ingestor" },
  { from: "apps/ingest/agents/k8s", to: "services/collector/ingestor" },
  { from: "apps/ingest/agents/syslog", to: "services/collector/ingestor" },
  { from: "apps/ingest/agents/host", to: "packages/utils/logger" },
  // apps/cli → query/logger
  { from: "apps/cli/commands/query", to: "services/query/engine" },
  { from: "apps/cli/commands/query", to: "packages/utils/logger" },
  // services/collector → buffer/db/logger
  { from: "services/collector/ingestor", to: "services/collector/buffer" },
  { from: "services/collector/ingestor", to: "packages/db/timeseries" },
  { from: "services/collector/buffer", to: "packages/db/objectstore" },
  { from: "services/collector/buffer", to: "packages/utils/logger" },
  // services/query → db/cache
  { from: "services/query/engine", to: "packages/db/timeseries" },
  { from: "services/query/engine", to: "services/query/cache" },
  { from: "services/query/cache", to: "packages/db/objectstore" },
  // services/alerts → engine/notifier
  { from: "services/alerts/evaluator", to: "services/query/engine" },
  { from: "services/alerts/evaluator", to: "packages/utils/logger" },
  { from: "services/alerts/notifier", to: "services/alerts/evaluator" },
  { from: "services/alerts/notifier", to: "packages/utils/logger" },
  // packages → infrastructure/logger
  { from: "packages/db/timeseries", to: "packages/utils/logger" },
  { from: "packages/db/objectstore", to: "packages/utils/logger" },
  { from: "packages/db/timeseries", to: "infrastructure/observability" },
  { from: "packages/db/objectstore", to: "infrastructure/observability" },
];

// ── Catalog ──────────────────────────────────────────────────────────────

const ACME_NODES: DepNode[] = withCounts(ACME_SEEDS, ACME_EDGES);
const STELLAR_NODES: DepNode[] = withCounts(STELLAR_SEEDS, STELLAR_EDGES);

/**
 * The id-keyed catalog of dependency graphs.
 *
 * `Record<string, DepGraph>` lets the lookup be `DEP_GRAPHS[id] ?? undefined`,
 * mirroring `lib/mock/architecture.ts` and `lib/mock/repos.ts` so the
 * panel's awaiting / unknown-repo / loaded branching works the same way.
 */
export const DEP_GRAPHS: Record<string, DepGraph> = {
  "acme/payments-platform": {
    nodes: ACME_NODES,
    edges: [...ACME_EDGES],
  },
  "stellar/orbit-ui": {
    nodes: STELLAR_NODES,
    edges: [...STELLAR_EDGES],
  },
};

/**
 * Resolve a `?repo=owner/name` value to its dependency graph.
 *
 * Returns `undefined` for unknown repos; callers must handle that
 * explicitly (the panel renders a forward-looking "not in catalog"
 * placeholder, just like `ArchitectureMap` does for `ArchGraph`).
 */
export function getDependencies(repoId: string | null): DepGraph | undefined {
  if (repoId === null) return undefined;
  return DEP_GRAPHS[repoId];
}
