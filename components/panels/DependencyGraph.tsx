"use client";

import dynamic from "next/dynamic";
import { useRepoSelection } from "@/lib/state/selection";
import { getDependencies } from "@/lib/mock/dependencies";
import { DEFAULT_REPO_ID } from "@/lib/mock/repos";
import type { DepGraph } from "@/lib/types";
import { LAYER_ORDER, layerColor } from "@/lib/palette";

/**
 * Lazy-loaded Dependency Graph panel.
 *
 * React Flow is a client-only library that touches `window` during
 * initialization; `next/dynamic({ ssr: false })` keeps it out of the
 * server bundle and the first paint, exactly as `claude.md` requires
 * for "heavy client-only libs".
 */
const DependencyGraphInner = dynamic(
  () => import("@/components/panels/DependencyGraphInner"),
  {
    ssr: false,
    loading: () => <DependencyGraphSkeleton />,
  },
);

/**
 * Dependency Graph panel (AC-6 + AC-7).
 *
 * Renders a React Flow graph of internal module-to-module dependencies
 * for the active repository. Branches on the URL-synced `?repo=`:
 * - no repo      → "awaiting" placeholder
 * - unknown repo → "not in catalog" placeholder
 * - known repo   → the React Flow graph (lazy-mounted on the client)
 *
 * The graph is fully data-driven — every node, position, file count,
 * dep count, and edge comes from `lib/mock/dependencies.ts`. The panel
 * itself contains no hard-coded module content.
 *
 * For AC-7, this panel also wires the URL-synced `?module=<id>` value
 * into the inner canvas: the node with the matching id is marked
 * `selected: true` (drives the cyan ring in `DepNode`), and a click
 * on any node calls `setModule(node.id)` so the URL becomes the
 * single source of truth shared with `ImpactAnalysis` and
 * `ArchitectureMap`.
 */
export function DependencyGraph() {
  const { repoId } = useRepoSelection();
  const graph = getDependencies(repoId);

  if (graph === undefined) {
    if (repoId === null) {
      return <AwaitingState />;
    }
    return <UnknownRepoState repoId={repoId} />;
  }

  return <LoadedState graph={graph} />;
}

// ── Awaiting (no repo) ───────────────────────────────────────────────────

function AwaitingState() {
  return (
    <section
      aria-label="Awaiting dependency graph"
      className="rounded-lg border border-dashed border-border-subtle bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        04 · Dependency Graph
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">no repository loaded</span> ·
        the module-to-module dependency graph renders once a repository
        is selected.
      </p>
    </section>
  );
}

// ── Unknown repo (forward-looking placeholder) ────────────────────────────

function UnknownRepoState({ repoId }: { repoId: string }) {
  return (
    <section
      aria-label="Unknown repository dependencies"
      className="rounded-lg border border-dashed border-accent-rose/40 bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-rose">
        04 · Dependency Graph · unknown
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">{repoId}</span> has no
        dependency graph in the demo catalog. Try{" "}
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

// ── Loaded (real panel) ──────────────────────────────────────────────────

function LoadedState({ graph }: { graph: DepGraph }) {
  const { moduleId, setModule } = useRepoSelection();
  return (
    <section
      aria-labelledby="dependency-graph-heading"
      className="rounded-lg border border-border-subtle bg-surface-panel"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-subtle px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          04 · Dependency Graph
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          {graph.nodes.length} modules · {graph.edges.length} deps · hover a node or edge
        </p>
      </header>

      <div className="space-y-4 p-6">
        <div>
          <h2
            id="dependency-graph-heading"
            className="font-mono text-base text-text-primary sm:text-lg"
          >
            Module-to-module dependencies
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-text-muted">
            Each node is an internal module; each edge shows that the
            source <em>imports from</em> the target. Hover a node to see
            its file count, inbound, and outbound counts; hover an edge
            to highlight it. <span className="text-text-primary">Click a node to select it for impact analysis.</span>
          </p>
        </div>

        <DependencyGraphInner
          graph={graph}
          moduleId={moduleId}
          onSelectModule={setModule}
        />

        <DepLegend />
      </div>
    </section>
  );
}

// ── Legend ──────────────────────────────────────────────────────────────

/**
 * Small HUD-style legend explaining the node-layer color (mirrors AC-5
 * for visual consistency) and the edge hover behavior. Stays desaturated;
 * only the legend's row icons use the layer swatch.
 */
function DepLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-subtle pt-4">
      {/* Layer color swatches */}
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {LAYER_ORDER.map((layer) => (
          <li
            key={layer}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted"
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: layerColor(layer) }}
            />
            <span>{layer}</span>
          </li>
        ))}
      </ul>

      {/* Edge hover key */}
      <ul className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <li className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-px w-4 bg-[#8a8a99]"
          />
          default edge
        </li>
        <li className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-0.5 w-4 bg-accent-cyan"
            style={{ height: 2 }}
          />
          hovered edge
        </li>
        <li className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-sm border border-accent-cyan/40 bg-accent-cyan/10"
          />
          hovered node · tooltip
        </li>
      </ul>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────

/**
 * Suspense-friendly loading state for the lazy-loaded React Flow mount.
 * Mimics the loaded layout (header, paragraph, and a 560 px panel-shaped
 * placeholder) so the page height doesn't jump when the canvas swaps in.
 */
function DependencyGraphSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[560px] w-full animate-pulse rounded border border-border-subtle bg-surface-base/60"
    >
      <div className="grid h-full place-items-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          loading dependencies…
        </p>
      </div>
    </div>
  );
}
