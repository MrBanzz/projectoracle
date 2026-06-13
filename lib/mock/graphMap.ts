import type { ArchGraph, DepGraph, DepNode } from "@/lib/types";

/**
 * Map a `DepNode.id` to its parent `ArchNode.id` within the same repo.
 *
 * The AC-5 architecture graph uses short, layer-level ids like
 * `apps/web` or `services/payments`, while the AC-6 dependency graph
 * uses longer, module-level ids like `apps/web/pages/checkout` or
 * `services/payments/processor`. The relation is a path-prefix match:
 * a dep module belongs to the architecture layer whose id is the
 * longest arch-node-id prefix of the dep module's id (with a `/`
 * separator at the boundary, so `apps/web/pages/checkout` resolves to
 * `apps/web` and not to a partial `apps/we`).
 *
 * This function lets both panels (Dependency Graph and Architecture
 * Map) agree on which architectural layer a selected dep module lives
 * in, so AC-7 can highlight the same logical node in both graphs
 * regardless of which graph the user clicked.
 *
 * @returns The parent `ArchNode.id`, or `null` if no prefix matches
 *          (which would mean the dep graph references an arch node
 *          that isn't in `ArchGraph.nodes` — a data inconsistency).
 */
export function archNodeIdForDepNode(
  depNodeId: string,
  archGraph: ArchGraph,
): string | null {
  // Sort arch node ids longest-first so the first match wins.
  const candidates = [...archGraph.nodes]
    .map((n) => n.id)
    .sort((a, b) => b.length - a.length);

  for (const archId of candidates) {
    if (depNodeId === archId || depNodeId.startsWith(`${archId}/`)) {
      return archId;
    }
  }
  return null;
}

/**
 * Convenience: return the matching `DepNode` from a `DepGraph`, or
 * `undefined` if the id doesn't exist. Used by `ImpactAnalysis` (AC-8)
 * to resolve the selected module id back to its record.
 */
export function findDepNode(
  graph: DepGraph,
  id: string,
): DepNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}
