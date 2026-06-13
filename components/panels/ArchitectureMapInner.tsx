"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge,
  type ReactFlowProps,
} from "reactflow";

import "reactflow/dist/style.css";

import { ArchNode, type ArchFlowNode } from "@/components/graph/ArchNode";
import { miniMapNodeColor } from "@/lib/palette";
import type { ArchEdge, ArchEdgeKind, ArchGraph } from "@/lib/types";

/**
 * Custom node-types registry for the Architecture Map.
 *
 * The custom `ArchNode` renders the rounded-rectangle treatment described
 * by AC-5; registering it under the `"arch"` type lets every node config
 * reference `type: "arch"` and stay consistent.
 */
const nodeTypes = { arch: ArchNode };

// ── Edge styling ─────────────────────────────────────────────────────────

/**
 * Visual treatment for each `ArchEdgeKind`. All three kinds share the
 * muted arrowhead color (so they sit on the desaturated layer palette),
 * but they differ in dash pattern and stroke tone to make
 * "calls" vs. "depends-on" vs. "owns" scannable in the legend.
 *
 * Colors are deliberately desaturated; this is non-interactive data, not
 * the accent palette (which is reserved for active / selected / risk).
 */
const EDGE_STYLE: Record<ArchEdgeKind, React.CSSProperties> = {
  calls: { stroke: "#8a8a99", strokeWidth: 1.25, strokeDasharray: "0" },
  "depends-on": { stroke: "#5a5a68", strokeWidth: 1, strokeDasharray: "4 3" },
  owns: { stroke: "#a78bfa", strokeWidth: 1.25, strokeDasharray: "0" },
};

const EDGE_LABEL: Record<ArchEdgeKind, string> = {
  calls: "calls",
  "depends-on": "depends on",
  owns: "owns",
};

/** Map our domain edge into the shape React Flow's <ReactFlow/> wants. */
function toFlowEdge(edge: ArchEdge, index: number): Edge {
  return {
    id: `e-${index}-${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    label: EDGE_LABEL[edge.kind],
    labelStyle: {
      fill: "#8a8a99",
      fontSize: 9,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      textTransform: "uppercase",
      letterSpacing: "0.18em",
    },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 2,
    labelBgStyle: { fill: "#111118", fillOpacity: 0.9 },
    style: EDGE_STYLE[edge.kind],
    type: "smoothstep",
    animated: false,
  };
}

/** Map our domain node into the shape React Flow's <ReactFlow/> wants. */
function toFlowNode(
  node: ArchGraph["nodes"][number],
  selectedId: string | null,
): ArchFlowNode {
  return {
    id: node.id,
    type: "arch",
    position: node.position,
    data: { label: node.label, layer: node.layer, selected: node.id === selectedId },
  };
}

// ── Component ────────────────────────────────────────────────────────────

interface ArchitectureMapInnerProps {
  /** The architecture graph to render. */
  graph: ArchGraph;
  /**
   * URL-synced id of the arch node to highlight (AC-7). Pass `null`
   * (the default) to clear the highlight. Computed by the parent
   * `ArchitectureMap` panel by mapping the selected dep module id
   * (e.g. `apps/web/pages/checkout`) up to its parent arch node
   * (e.g. `apps/web`).
   */
  selectedNodeId?: string | null;
}

/**
 * Inner Architecture Map component. Receives the resolved `ArchGraph` and
 * is responsible for:
 *   - converting our domain types into React Flow's `Node[]` / `Edge[]`,
 *   - marking the URL-selected arch node as `selected: true` so the
 *     cyan ring shows up (AC-7),
 *   - rendering the canvas with `Background`, `Controls`, and `MiniMap`,
 *   - calling `fitView` on mount so all 10 nodes are visible without
 *     user interaction.
 *
 * The parent wraps this with `next/dynamic({ ssr: false })` because React
 * Flow is a client-only library; keeping the conversion logic here means
 * the SSR boundary is a single import line.
 */
function ArchitectureMapInner({
  graph,
  selectedNodeId = null,
}: ArchitectureMapInnerProps) {
  const nodes = useMemo<ArchFlowNode[]>(
    () => graph.nodes.map((n) => toFlowNode(n, selectedNodeId)),
    [graph.nodes, selectedNodeId],
  );
  const edges = useMemo<Edge[]>(
    () => graph.edges.map(toFlowEdge),
    [graph.edges],
  );

  // Disable interaction features that don't apply to a read-only demo.
  const defaultViewport: ReactFlowProps["defaultViewport"] = { x: 0, y: 0, zoom: 1 };

  return (
    <div className="h-[520px] w-full overflow-hidden rounded border border-border-subtle bg-surface-base">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        fitView
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.4}
        maxZoom={1.8}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(34, 211, 238, 0.12)"
        />
        <Controls
          showInteractive={false}
          className="!bottom-3 !left-3 !top-auto"
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(10, 10, 15, 0.85)"
          nodeColor={miniMapNodeColor}
          nodeStrokeColor="transparent"
          style={{
            backgroundColor: "#111118",
            border: "1px solid #1f1f2b",
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default ArchitectureMapInner;
