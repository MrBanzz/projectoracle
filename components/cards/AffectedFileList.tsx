"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sorted file-path list used by the AC-8 Impact Analysis panel to
 * show which files are at risk when the selected module changes.
 *
 * The list is sorted alphabetically (the lib/mock/impact.ts pipeline
 * already sorts before handing the array off). By default we render
 * the first `TOP_N` (20) entries plus a "show all / show less"
 * expander that toggles the rest. The full count is always visible
 * in the section caption so the user knows how much they're not
 * seeing when collapsed.
 */

const TOP_N = 20;

interface AffectedFileListProps {
  /** Sorted list of file paths. */
  files: ReadonlyArray<string>;
  /** Optional caption override (e.g. "affected by this change"). */
  caption?: string;
  className?: string;
}

export function AffectedFileList({
  files,
  caption = "affected files",
  className,
}: AffectedFileListProps) {
  const [expanded, setExpanded] = useState(false);

  // Edge case: empty list. Render a friendly placeholder so the
  // panel doesn't collapse on modules with no dependents.
  if (files.length === 0) {
    return (
      <div
        className={cn(
          "rounded border border-border-subtle bg-surface-raised/40 p-4",
          className,
        )}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          Affected files
        </p>
        <p className="mt-2 text-sm text-text-muted">
          No files affected — this module has no downstream consumers
          in the dep graph.
        </p>
      </div>
    );
  }

  const visible = expanded ? files : files.slice(0, TOP_N);
  const hiddenCount = files.length - visible.length;

  return (
    <div
      className={cn(
        "rounded border border-border-subtle bg-surface-raised/40",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border-subtle px-4 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          Affected files
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          {files.length} {caption}
          {hiddenCount > 0 ? (
            <span className="text-text-muted"> · showing {visible.length}</span>
          ) : null}
        </p>
      </div>

      {/* File path rows */}
      <ul
        className="divide-y divide-border-subtle font-mono text-[11px]"
        // `aria-label` lets screen readers announce the region.
        aria-label={`Affected files: ${files.length}`}
      >
        {visible.map((file) => (
          <li
            key={file}
            className="flex items-baseline gap-3 px-4 py-1.5 text-text-primary"
          >
            <span
              aria-hidden="true"
              className="inline-block h-1 w-1 shrink-0 rounded-full bg-accent-cyan/60"
            />
            <span className="truncate" title={file}>
              {file}
            </span>
          </li>
        ))}
      </ul>

      {/* Show-all / show-less expander */}
      {hiddenCount > 0 ? (
        <div className="border-t border-border-subtle px-4 py-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em]",
              "text-accent-cyan transition-colors hover:text-accent-cyan/80",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan",
            )}
            aria-label={`Show all ${files.length} affected files`}
          >
            <span>show all {files.length} files</span>
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-3 w-3"
            >
              <path d="M3 5l3 3 3-3" />
            </svg>
          </button>
        </div>
      ) : expanded ? (
        <div className="border-t border-border-subtle px-4 py-2">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em]",
              "text-text-muted transition-colors hover:text-text-primary",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan",
            )}
            aria-label="Show top 20 affected files only"
          >
            <span>show top {TOP_N} only</span>
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-3 w-3 rotate-180"
            >
              <path d="M3 5l3 3 3-3" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
