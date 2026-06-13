import type { ArchEdge, ArchGraph, ArchNode } from "@/lib/types";

/**
 * Hand-laid, per-repo architecture graph used by the AC-5 Architecture Map.
 *
 * Layout
 * ------
 * Nodes are arranged in a 4-row layered topology that reads top-down:
 *   row 0  apps           (3 nodes, evenly spread)
 *   row 1  services       (3 nodes, evenly spread)
 *   row 2  packages       (3 nodes, evenly spread)
 *   row 3  infrastructure (1 node, centered)
 *
 * Horizontal spacing is 320 px and vertical spacing is 240 px, so two
 * adjacent node rectangles (~180×80) never overlap, and the React Flow
 * viewport's `fitView` option lands them comfortably inside the canvas.
 *
 * Layer coverage
 * --------------
 * The plan calls for "at least 8 distinct nodes representing
 * architectural layers (e.g., `apps/web`, `apps/api`, `services/payments`,
 * `services/auth`, `packages/ui`, `packages/db`, `packages/utils`,
 * `infrastructure`)". Each seeded repo here has 10 nodes, one for every
 * cell in the 4×3 grid above plus the `infrastructure` anchor.
 *
 * Edge typing
 * -----------
 * `ArchEdgeKind` has three values:
 *   - `calls`        : a runtime request from one node to another
 *                      (typically app → service)
 *   - `depends-on`   : a build-time / import dependency
 *                      (typically service → package, or app → package)
 *   - `owns`         : a deployment / ownership relation
 *                      (typically a top-level app or service that owns
 *                      shared infrastructure)
 *
 * Each graph has ≥ 10 typed edges (the AC-5 verification threshold).
 */

const X_COL = [0, 320, 640] as const;
const Y_ROW = { apps: 0, services: 240, packages: 480, infra: 720 } as const;

/** Layout helper: keep node positions DRY across repos. */
function node(
  id: string,
  label: string,
  layer: ArchNode["layer"],
  col: 0 | 1 | 2,
  row: keyof typeof Y_ROW,
): ArchNode {
  return {
    id,
    label,
    layer,
    position: { x: X_COL[col], y: Y_ROW[row] },
  };
}

// ── acme/payments-platform ────────────────────────────────────────────────

const ACME_NODES: ArchNode[] = [
  node("apps/web", "apps/web", "apps", 0, "apps"),
  node("apps/api", "apps/api", "apps", 1, "apps"),
  node("apps/admin", "apps/admin", "apps", 2, "apps"),
  node("services/auth", "services/auth", "services", 0, "services"),
  node("services/payments", "services/payments", "services", 1, "services"),
  node("services/ledger", "services/ledger", "services", 2, "services"),
  node("packages/ui", "packages/ui", "packages", 0, "packages"),
  node("packages/db", "packages/db", "packages", 1, "packages"),
  node("packages/utils", "packages/utils", "packages", 2, "packages"),
  node("infrastructure", "infrastructure", "infrastructure", 1, "infra"),
];

const ACME_EDGES: ArchEdge[] = [
  // apps/web → services
  { from: "apps/web", to: "services/auth", kind: "calls" },
  { from: "apps/web", to: "services/payments", kind: "calls" },
  { from: "apps/web", to: "services/ledger", kind: "calls" },
  // apps/web → packages
  { from: "apps/web", to: "packages/ui", kind: "depends-on" },
  { from: "apps/web", to: "packages/utils", kind: "depends-on" },
  // apps/api → services
  { from: "apps/api", to: "services/auth", kind: "calls" },
  { from: "apps/api", to: "services/payments", kind: "calls" },
  { from: "apps/api", to: "services/ledger", kind: "calls" },
  // apps/api → packages
  { from: "apps/api", to: "packages/db", kind: "depends-on" },
  { from: "apps/api", to: "packages/utils", kind: "depends-on" },
  // apps/admin → services
  { from: "apps/admin", to: "services/auth", kind: "calls" },
  { from: "apps/admin", to: "services/ledger", kind: "calls" },
  // apps/admin → packages
  { from: "apps/admin", to: "packages/ui", kind: "depends-on" },
  { from: "apps/admin", to: "packages/utils", kind: "depends-on" },
  // services → packages
  { from: "services/payments", to: "packages/db", kind: "depends-on" },
  { from: "services/payments", to: "packages/utils", kind: "depends-on" },
  { from: "services/auth", to: "packages/db", kind: "depends-on" },
  { from: "services/auth", to: "packages/utils", kind: "depends-on" },
  { from: "services/ledger", to: "packages/db", kind: "depends-on" },
  { from: "services/ledger", to: "packages/utils", kind: "depends-on" },
  // services → infrastructure
  { from: "services/payments", to: "infrastructure", kind: "depends-on" },
  { from: "services/auth", to: "infrastructure", kind: "depends-on" },
  { from: "services/ledger", to: "infrastructure", kind: "depends-on" },
  // packages → packages
  { from: "packages/ui", to: "packages/utils", kind: "depends-on" },
  // apps/api owns shared infrastructure (deploys & operates it)
  { from: "apps/api", to: "infrastructure", kind: "owns" },
];

// ── stellar/orbit-ui ──────────────────────────────────────────────────────

const STELLAR_NODES: ArchNode[] = [
  node("apps/web", "apps/web", "apps", 0, "apps"),
  node("apps/ingest", "apps/ingest", "apps", 1, "apps"),
  node("apps/cli", "apps/cli", "apps", 2, "apps"),
  node("services/collector", "services/collector", "services", 0, "services"),
  node("services/query", "services/query", "services", 1, "services"),
  node("services/alerts", "services/alerts", "services", 2, "services"),
  node("packages/ui", "packages/ui", "packages", 0, "packages"),
  node("packages/db", "packages/db", "packages", 1, "packages"),
  node("packages/utils", "packages/utils", "packages", 2, "packages"),
  node("infrastructure", "infrastructure", "infrastructure", 1, "infra"),
];

const STELLAR_EDGES: ArchEdge[] = [
  // apps/web → services
  { from: "apps/web", to: "services/query", kind: "calls" },
  { from: "apps/web", to: "services/alerts", kind: "calls" },
  // apps/web → packages
  { from: "apps/web", to: "packages/ui", kind: "depends-on" },
  { from: "apps/web", to: "packages/utils", kind: "depends-on" },
  // apps/ingest → services
  { from: "apps/ingest", to: "services/collector", kind: "calls" },
  { from: "apps/ingest", to: "services/query", kind: "calls" },
  // apps/ingest → packages / infra
  { from: "apps/ingest", to: "packages/utils", kind: "depends-on" },
  { from: "apps/ingest", to: "infrastructure", kind: "depends-on" },
  // apps/cli → services
  { from: "apps/cli", to: "services/query", kind: "calls" },
  { from: "apps/cli", to: "packages/utils", kind: "depends-on" },
  // services/collector → packages / infra
  { from: "services/collector", to: "packages/db", kind: "depends-on" },
  { from: "services/collector", to: "infrastructure", kind: "depends-on" },
  // services/query → packages
  { from: "services/query", to: "packages/db", kind: "depends-on" },
  { from: "services/query", to: "packages/utils", kind: "depends-on" },
  { from: "services/query", to: "services/collector", kind: "calls" },
  // services/alerts → packages / infra
  { from: "services/alerts", to: "packages/db", kind: "depends-on" },
  { from: "services/alerts", to: "packages/utils", kind: "depends-on" },
  { from: "services/alerts", to: "infrastructure", kind: "depends-on" },
  { from: "services/alerts", to: "services/collector", kind: "calls" },
  // packages → packages
  { from: "packages/ui", to: "packages/utils", kind: "depends-on" },
  // services/alerts owns the alerting channel of the shared infrastructure
  { from: "services/alerts", to: "infrastructure", kind: "owns" },
];

// ── Catalog ───────────────────────────────────────────────────────────────

/**
 * The id-keyed catalog of architecture graphs.
 *
 * `Record<string, ArchGraph>` lets the lookup be `ARCH_GRAPHS[id] ?? undefined`,
 * mirroring `lib/mock/repos.ts` and the AC-10 "unknown repo" branching.
 */
export const ARCH_GRAPHS: Record<string, ArchGraph> = {
  "acme/payments-platform": {
    nodes: ACME_NODES,
    edges: ACME_EDGES,
  },
  "stellar/orbit-ui": {
    nodes: STELLAR_NODES,
    edges: STELLAR_EDGES,
  },
};

/**
 * Resolve a `?repo=owner/name` value to its architecture graph.
 *
 * Returns `undefined` for unknown repos; callers must handle that
 * explicitly (the panel renders a forward-looking "not in catalog"
 * placeholder, just like `RepoOverview` does for `RepoData`).
 */
export function getArchitecture(repoId: string | null): ArchGraph | undefined {
  if (repoId === null) return undefined;
  return ARCH_GRAPHS[repoId];
}
