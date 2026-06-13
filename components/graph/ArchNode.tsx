"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "reactflow";
import { layerColor } from "@/lib/palette";
import type { ArchLayer } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Data shape passed to the AC-5 custom React Flow node.
 *
 * This mirrors the slice of `ArchNode` that the renderer actually uses;
 * `position` is consumed by React Flow itself, not by the component.
 */
export interface ArchNodeData {
  /** Display label, e.g. "apps/web". Rendered in a monospaced font. */
  label: string;
  /** Drives the swatch color. */
  layer: ArchLayer;
  /** When true, the panel applies the cyan "selected" ring (AC-7). */
  selected?: boolean;
}

export type ArchFlowNode = Node<ArchNodeData, "arch">;

/**
 * Custom React Flow node for the AC-5 Architecture Map.
 *
 * Visual treatment:
 * - Rounded rectangle, monospaced label, layer-colored left rule.
 * - The body is `surface-raised` (a desaturated dark gray) so the layer
 *   color reads as the only chromatic element on the node.
 * - Subtle border that brightens to cyan on the "selected" state, which
 *   AC-7 will wire to the URL-synced module id.
 * - Source + target handles on all four sides so edges can land on the
 *   closest face regardless of grid position.
 */
function ArchNodeImpl({ data, selected }: NodeProps<ArchNodeData>) {
  const swatch = layerColor(data.layer);
  return (
    <div
      className={cn(
        "relative min-w-[180px] rounded-md border bg-surface-raised",
        "font-mono text-xs text-text-primary shadow-sm",
        "transition-colors",
        selected
          ? "border-accent-cyan shadow-glow-cyan"
          : "border-border-subtle",
      )}
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

      <div className="px-3 py-2">
        <p
          aria-label={`Architecture layer · ${data.layer}`}
          className="font-mono text-[9px] uppercase tracking-[0.22em] text-text-dim"
        >
          {data.layer}
        </p>
        <p className="mt-0.5 font-mono text-xs font-medium text-text-primary">
          {data.label}
        </p>
      </div>
    </div>
  );
}

/**
 * Memoized export. The component is pure on `data` and `selected`; React
 * Flow will re-render on those changes, so memoizing avoids unnecessary
 * repaints during viewport panning / zooming.
 */
export const ArchNode = memo(ArchNodeImpl);
