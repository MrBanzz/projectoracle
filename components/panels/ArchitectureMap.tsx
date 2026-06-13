"use client";

import dynamic from "next/dynamic";
import { useRepoSelection } from "@/lib/state/selection";
import { getArchitecture } from "@/lib/mock/architecture";
import { getDependencies } from "@/lib/mock/dependencies";
import { archNodeIdForDepNode } from "@/lib/mock/graphMap";
import { DEFAULT_REPO_ID } from "@/lib/mock/repos";
import type { ArchGraph } from "@/lib/types";
import { LAYER_ORDER, layerColor } from "@/lib/palette";

/**
 * Lazy-loaded Architecture Map panel.
 *
 * React Flow is a client-only library that touches `window` during
 * initialization; `next/dynamic({ ssr: false })` keeps it out of the
 * server bundle and the first paint, exactly as `claude.md` requires
 * for "heavy client-only libs".
 */
const ArchitectureMapInner = dynamic(
  () => import("@/components/panels/ArchitectureMapInner"),
  {
    ssr: false,
    loading: () => <ArchitectureMapSkeleton />,
  },
);

/**
 * Architecture Map panel (AC-5 + AC-7).
 *
 * Renders a React Flow graph of architectural layers for the active
 * repository. Branches on the URL-synced `?repo=`:
 * - no repo      → "awaiting" placeholder
 * - unknown repo → "not in catalog" placeholder
 * - known repo   → the React Flow graph (lazy-mounted on the client)
 *
 * The graph is fully data-driven — every node label, position, layer
 * color, and typed edge comes from `lib/mock/architecture.ts`. The
 * panel itself contains no hard-coded architectural content.
 *
 * For AC-7, this panel also reflects the URL-synced `?module=<id>`:
 * the matching dep module's parent architectural node (e.g. the
 * module `apps/web/pages/checkout` lives under arch node `apps/web`)
 * is marked `selected: true` so the cyan ring shows up in BOTH
 * graphs, regardless of which one the user clicked.
 */
export function ArchitectureMap() {
  const { repoId } = useRepoSelection();
  const graph = getArchitecture(repoId);

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
      aria-label="Awaiting architecture map"
      className="rounded-lg border border-dashed border-border-subtle bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
        03 · Architecture Map
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">no repository loaded</span> ·
        the layered architecture diagram renders once a repository is
        selected.
      </p>
    </section>
  );
}

// ── Unknown repo (forward-looking placeholder) ────────────────────────────

function UnknownRepoState({ repoId }: { repoId: string }) {
  return (
    <section
      aria-label="Unknown repository architecture"
      className="rounded-lg border border-dashed border-accent-rose/40 bg-surface-panel/40 p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-rose">
        03 · Architecture Map · unknown
      </p>
      <p className="mt-2 text-sm text-text-muted">
        <span className="font-mono text-text-primary">{repoId}</span> has no
        architecture map in the demo catalog. Try{" "}
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

function LoadedState({ graph }: { graph: ArchGraph }) {
  const { repoId, moduleId } = useRepoSelection();
  // Resolve the URL-synced dep module id (e.g. "apps/web/pages/checkout")
  // up to its parent arch node (e.g. "apps/web") so the right
  // architectural layer is marked as selected. This is the AC-7
  // "highlight in both graphs" wiring: clicking a dep node or picking
  // a module from the Impact Analysis combobox both flow into this same
  // computed value, so both panels agree.
  const depGraph = getDependencies(repoId);
  const selectedArchId =
    moduleId !== null && depGraph !== undefined
      ? archNodeIdForDepNode(moduleId, graph)
      : null;

  return (
    <section
      aria-labelledby="architecture-map-heading"
      className="rounded-lg border border-border-subtle bg-surface-panel"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-subtle px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          03 · Architecture Map
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          {selectedArchId
            ? `selected · ${selectedArchId}`
            : "layered diagram · pan / zoom / fit"}
        </p>
      </header>

      <div className="space-y-4 p-6">
        <div>
          <h2
            id="architecture-map-heading"
            className="font-mono text-base text-text-primary sm:text-lg"
          >
            Layered architecture
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-text-muted">
            Each node is a top-level workspace; each edge shows how the
            source <em>calls</em>, <em>depends on</em>, or <em>owns</em>{" "}
            the target. Layers are color-coded.
            {selectedArchId ? (
              <>
                {" "}
                <span className="text-text-primary">
                  The selected module lives in <code className="font-mono text-accent-cyan">{selectedArchId}</code>.
                </span>
              </>
            ) : null}
          </p>
        </div>

        <ArchitectureMapInner
          graph={graph}
          selectedNodeId={selectedArchId}
        />

        <ArchLegend />
      </div>
    </section>
  );
}

// ── Legend ──────────────────────────────────────────────────────────────

/**
 * Small HUD-style legend explaining the node-layer color and the three
 * edge kinds. Stays desaturated; only the legend's row icons use the
 * layer swatch.
 */
function ArchLegend() {
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

      {/* Edge kind key */}
      <ul className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <li className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-px w-4 bg-[#8a8a99]"
          />
          calls
        </li>
        <li className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 1"
            className="h-px w-4"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="0.5"
              x2="16"
              y2="0.5"
              stroke="#5a5a68"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          </svg>
          depends on
        </li>
        <li className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          <span
            aria-hidden="true"
            className="inline-block h-px w-4"
            style={{ backgroundColor: "#a78bfa" }}
          />
          owns
        </li>
      </ul>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────

/**
 * Suspense-friendly loading state for the lazy-loaded React Flow mount.
 * Mimics the loaded layout (header, paragraph, and a 520px panel-shaped
 * placeholder) so the page height doesn't jump when the canvas swaps in.
 */
function ArchitectureMapSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[520px] w-full animate-pulse rounded border border-border-subtle bg-surface-base/60"
    >
      <div className="grid h-full place-items-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          loading architecture…
        </p>
      </div>
    </div>
  );
}
