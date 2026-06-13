"use client";

import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import { cn } from "@/lib/utils";

/**
 * Data shape passed to the AC-6 custom React Flow edge.
 *
 * AC-6's domain `DepEdge` has no `kind` (the only relation is "imports
 * from"), so the visual treatment is a single style. The custom edge
 * still gets a `hovered` flag — driven by `onEdgeMouseEnter` /
 * `onEdgeMouseLeave` on the parent `<ReactFlow/>` — so AC-6's "hover an
 * edge to highlight it" requirement is satisfied.
 */
export interface DepEdgeData {
  /** When true, the edge draws in the accent cyan with a wider stroke. */
  hovered?: boolean;
}

export type DepFlowEdge = DepEdgeData;

/**
 * Custom React Flow edge for the AC-6 Dependency Graph.
 *
 * Visual treatment:
 * - Default: 1.25px stroke in the desaturated `text-muted` color with
 *   a small inline label "imports from" so the edge direction reads
 *   even at zoom-out.
 * - Hovered: 2px stroke in `accent-cyan` so the user can pick the line
 *   out of the dense dep graph.
 *
 * The hover state lives both in the parent's `data.hovered` (driven
 * by the panel) and in local `useState` (so the stroke widens
 * immediately on mouseover, even before the parent re-renders).
 */
function DepEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<DepEdgeData>) {
  const [localHover, setLocalHover] = useState(false);
  const isHovered = data?.hovered === true || localHover;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setLocalHover(true)}
        onMouseLeave={() => setLocalHover(false)}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isHovered ? "#22d3ee" : "#8a8a99",
          strokeWidth: isHovered ? 2 : 1.25,
          transition: "stroke 120ms ease-out, stroke-width 120ms ease-out",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none",
            "rounded-sm px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.18em]",
            "border border-border-subtle",
            isHovered
              ? "bg-surface-base text-accent-cyan"
              : "bg-surface-base/80 text-text-dim",
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          imports from
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

/**
 * Memoized export. The component is pure on its props; React Flow will
 * re-render when the parent updates `data.hovered`, so memoizing avoids
 * unnecessary repaints during viewport panning.
 */
export const DepEdge = memo(DepEdgeImpl);
