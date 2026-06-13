"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps, type Node } from "reactflow";
import { layerColor } from "@/lib/palette";
import type { ArchLayer } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Data shape passed to the AC-6 custom React Flow node.
 *
 * This mirrors the slice of `DepNode` that the renderer actually uses;
 * `position` is consumed by React Flow itself, not by the component.
 * `hovered` is a runtime signal driven by `onNodeMouseEnter` /
 * `onNodeMouseLeave` on the parent `<ReactFlow/>`, used to raise the
 * hovered node above its siblings and to keep the tooltip pinned to the
 * right element.
 */
export interface DepNodeData {
  /** Display label, e.g. "apps/web/pages/checkout". */
  label: string;
  /** Number of source files in this module. */
  files: number;
  /** Inbound dependency count (modules that import this one). */
  inCount: number;
  /** Outbound dependency count (modules this one imports). */
  outCount: number;
  /** Layer drives the left-rule swatch; mirrors the AC-5 layer palette. */
  layer: ArchLayer;
  /** When true, the node shows its hover tooltip. */
  hovered?: boolean;
  /** When true, the panel applies the cyan "selected" ring (AC-7). */
  selected?: boolean;
}

export type DepFlowNode = Node<DepNodeData, "dep">;

/**
 * Custom React Flow node for the AC-6 Dependency Graph.
 *
 * Visual treatment:
 * - Rounded rectangle, monospaced label, layer-colored left rule.
 * - File count, in-count, and out-count shown as small monospaced chips
 *   on the right so the node footprint stays compact (~180×60).
 * - On hover, a tooltip is mounted above the node with the full module
 *   path, file count, and inbound/outbound dep counts in plain English.
 * - Source + target handles on all four sides so edges can land on the
 *   closest face regardless of grid position.
 *
 * The hovered state is driven by the parent ReactFlow
 * (onNodeMouseEnter / onNodeMouseLeave). The local `useState` is only a
 * hint for the *tooltip* z-order: the panel always drives `hovered`
 * via the data prop, so a single source of truth wins.
 */
function DepNodeImpl({ data, selected }: NodeProps<DepNodeData>) {
  const swatch = layerColor(data.layer);
  const [pinnedHover, setPinnedHover] = useState(false);
  const showTooltip = data.hovered === true || pinnedHover;

  return (
    <div
      className={cn(
        "relative min-w-[180px] rounded-md border bg-surface-raised",
        "font-mono text-xs text-text-primary shadow-sm",
        "transition-colors",
        selected || data.hovered
          ? "border-accent-cyan shadow-glow-cyan"
          : "border-border-subtle",
      )}
      onMouseEnter={() => setPinnedHover(true)}
      onMouseLeave={() => setPinnedHover(false)}
    >
      {/* Layer color bar on the left edge */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 rounded-l-md"
        style={{ backgroundColor: swatch }}
      />

      {/* Connection handles on all four sides */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1.5 !w-1.5 !border-0 !bg-border-strong"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!h-1.5 !w-1.5 !border-0 !bg-border-strong"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-1.5 !w-1.5 !border-0 !bg-border-strong"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1.5 !w-1.5 !border-0 !bg-border-strong"
        isConnectable={false}
      />

      <div className="flex items-center gap-3 px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] font-medium text-text-primary">
            {data.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-text-dim">
          <CountChip label="in" value={data.inCount} />
          <CountChip label="out" value={data.outCount} />
          <CountChip label="files" value={data.files} />
        </div>
      </div>

      {showTooltip ? <DepTooltip data={data} /> : null}
    </div>
  );
}

/**
 * Small monospaced chip rendering a numeric label/value pair. Stays
 * within the node's visual budget so the dep graph stays compact.
 */
function CountChip({ label, value }: { label: string; value: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-sm border border-border-subtle bg-surface-base/60 px-1 py-px tabular-nums text-text-muted"
      title={`${label}: ${value}`}
    >
      <span aria-hidden="true">{label}</span>
      <span className="text-text-primary">{value}</span>
    </span>
  );
}

/**
 * Hover-tooltip element rendered above the node when hovered. Uses
 * `pointer-events: none` so the tooltip itself never eats the hover
 * state. Positioned absolutely so it doesn't push other nodes around.
 */
function DepTooltip({ data }: { data: DepNodeData }) {
  return (
    <div
      role="tooltip"
      style={{ pointerEvents: "none" }}
      className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-md border border-accent-cyan/30 bg-surface-base/95 px-3 py-2 font-mono text-[11px] text-text-primary shadow-glow-cyan backdrop-blur"
    >
      <p className="truncate text-text-primary">{data.label}</p>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10px] uppercase tracking-[0.18em] text-text-dim">
        <dt>files</dt>
        <dd className="text-right text-text-primary tabular-nums">{data.files}</dd>
        <dt>inbound</dt>
        <dd className="text-right text-text-primary tabular-nums">
          {data.inCount} {data.inCount === 1 ? "module" : "modules"}
        </dd>
        <dt>outbound</dt>
        <dd className="text-right text-text-primary tabular-nums">
          {data.outCount} {data.outCount === 1 ? "module" : "modules"}
        </dd>
        <dt>layer</dt>
        <dd className="text-right text-text-primary">{data.layer}</dd>
      </dl>
    </div>
  );
}

/**
 * Memoized export. The component is pure on `data` and `selected`; React
 * Flow will re-render on those changes, so memoizing avoids unnecessary
 * repaints during viewport panning / zooming.
 */
export const DepNode = memo(DepNodeImpl);
