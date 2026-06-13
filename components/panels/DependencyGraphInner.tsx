"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type ReactFlowProps,
} from "reactflow";

import "reactflow/dist/style.css";

import { DepNode, type DepFlowNode } from "@/components/graph/DepNode";
import { DepEdge, type DepEdgeData } from "@/components/graph/DepEdge";
import { miniMapNodeColor } from "@/lib/palette";
import type { DepEdge as DomainDepEdge, DepGraph } from "@/lib/types";

/**
 * Custom node + edge type registries for the Dependency Graph.
 *
 * `DepNode` is the rounded-rectangle custom node that renders file /
 * inbound / outbound counts and a hover tooltip; `DepEdge` is the
 * custom edge that highlights in cyan on hover. Registering them here
 * lets every node / edge config reference the same string literal.
 */
const nodeTypes = { dep: DepNode };
const edgeTypes = { depEdge: DepEdge };

// ── Conversions ──────────────────────────────────────────────────────────

/** Map our domain edge into the shape React Flow's <ReactFlow/> wants. */
function toFlowEdge(edge: DomainDepEdge, index: number): Edge<DepEdgeData> {
  return {
    id: `e-${index}-${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    type: "depEdge",
    data: { hovered: false },
  };
}

/** Map our domain node into the shape React Flow's <ReactFlow/> wants. */
function toFlowNode(
  node: DepGraph["nodes"][number],
  isSelected: boolean,
): DepFlowNode {
  return {
    id: node.id,
    type: "dep",
    position: node.position,
    data: {
      label: node.label,
      files: node.files,
      inCount: node.inCount,
      outCount: node.outCount,
      layer: node.layer,
      hovered: false,
      selected: isSelected,
    },
  };
}

// ── Component ────────────────────────────────────────────────────────────

interface DependencyGraphInnerProps {
  /** The dependency graph to render. */
  graph: DepGraph;
  /**
   * URL-synced id of the currently selected module. The matching node
   * is rendered with `selected: true` so the cyan ring shows up
   * (AC-7). Pass `null` to clear selection.
   */
  moduleId: string | null;
  /**
   * Called with the id of the node the user clicked. The panel's
   * parent translates this into a `setModule(id)` call which writes
   * `?module=<id>` to the URL — the URL is the single source of
   * truth shared with `ImpactAnalysis` and `ArchitectureMap`.
   */
  onSelectModule: (id: string) => void;
}

/**
 * Inner Dependency Graph component. Receives the resolved `DepGraph` and
 * is responsible for:
 *   - converting our domain types into React Flow's `Node[]` / `Edge[]`,
 *   - tracking which node / edge is currently hovered (single source of
 *     truth for the tooltip and the edge highlight),
 *   - marking the URL-selected node as `selected: true` so the cyan
 *     ring shows up (AC-7),
 *   - rendering the canvas with `Background`, `Controls`, and `MiniMap`,
 *   - calling `fitView` on mount so all nodes are visible without user
 *     interaction.
 *
 * The parent wraps this with `next/dynamic({ ssr: false })` because React
 * Flow is a client-only library; keeping the conversion + hover state
 * here means the SSR boundary is a single import line.
 *
 * The hover state lives in `React.useState` rather than on each
 * `data` field, but we mirror it into the per-node `data.hovered` field
 * so the `DepNode` can read it via props. This keeps the React Flow
 * internals happy (it diffs `data` to decide what to re-render) while
 * still letting us pass the canonical "which node is hovered" answer
 * down without prop-drilling.
 */
function DependencyGraphInner({
  graph,
  moduleId,
  onSelectModule,
}: DependencyGraphInnerProps) {
  // Initial nodes / edges derived from the graph + URL-synced selection.
  // `moduleId` participates in the seed so a server-rendered hit (or a
  // re-mount after a route push) shows the cyan ring on the right node
  // from the very first frame, not after a state-update tick.
  const initialNodes = useMemo<DepFlowNode[]>(
    () => graph.nodes.map((n) => toFlowNode(n, n.id === moduleId)),
    [graph.nodes, moduleId],
  );
  const initialEdges = useMemo<Edge<DepEdgeData>[]>(
    () => graph.edges.map(toFlowEdge),
    [graph.edges],
  );

  // Live nodes / edges. We replace these on every hover / selection
  // change so React Flow re-renders the affected node / edge only. The
  // dep graph is small enough that a full array replacement is fine.
  const [nodes, setNodes] = useState<DepFlowNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge<DepEdgeData>[]>(initialEdges);

  // Mirror the URL-synced `moduleId` into the `selected` flag on every
  // node. React Flow diffs `data` to decide what to re-render, so this
  // is the single source of truth for the cyan ring.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === moduleId },
      })),
    );
  }, [moduleId]);

  // Helper: build a node array with the given id marked as hovered and
  // every other node un-hovered. Used by the mouse handlers.
  const setNodeHovered = useCallback((id: string | null) => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, hovered: n.id === id },
      })),
    );
  }, []);

  // Helper: build an edge array with the given id marked as hovered
  // and every other edge un-hovered.
  const setEdgeHovered = useCallback((id: string | null) => {
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        data: { ...(e.data ?? {}), hovered: e.id === id },
      })),
    );
  }, []);

  const onNodeMouseEnter: NodeMouseHandler = useCallback(
    (_event, node) => {
      setNodeHovered(node.id);
    },
    [setNodeHovered],
  );

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    setNodeHovered(null);
  }, [setNodeHovered]);

  const onEdgeMouseEnter: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      setEdgeHovered(edge.id);
    },
    [setEdgeHovered],
  );

  const onEdgeMouseLeave: EdgeMouseHandler = useCallback(() => {
    setEdgeHovered(null);
  }, [setEdgeHovered]);

  // Click-to-select (AC-7). The parent (DependencyGraph) routes this
  // into `setModule(node.id)`, which writes `?module=<id>` to the URL
  // and re-renders the rest of the page (Impact Analysis, Architecture
  // Map) from that single source of truth.
  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onSelectModule(node.id);
    },
    [onSelectModule],
  );

  const defaultViewport: ReactFlowProps["defaultViewport"] = { x: 0, y: 0, zoom: 1 };

  return (
    <div className="h-[560px] w-full overflow-hidden rounded border border-border-subtle bg-surface-base">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        fitView
        fitViewOptions={{ padding: 0.18, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.4}
        maxZoom={1.8}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(34, 211, 238, 0.1)"
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

export default DependencyGraphInner;
