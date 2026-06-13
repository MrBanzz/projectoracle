"use client";

import { StatusDot } from "./StatusDot";
import { useRepoSelection } from "@/lib/state/selection";
import { cn } from "@/lib/utils";

interface TopBarProps {
  className?: string;
}

/**
 * Persistent top bar. Renders the active repository context (driven by
 * `?repo=` in AC-3) and a primary action on the right. Accent (cyan) is
 * reserved for active/selected state; the primary "re-analyze" action uses a
 * non-accent treatment while disabled and switches to cyan only when the
 * repository context is loaded.
 */
export function TopBar({ className }: TopBarProps) {
  const { repoId } = useRepoSelection();
  const hasRepo = repoId !== null;

  return (
    <header
      className={cn(
        "flex h-14 items-center gap-4 border-b border-border-subtle bg-surface-panel px-4 lg:px-6",
        className,
      )}
    >
      {/* Center: active repo context */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim lg:inline">
          repo
        </span>
        <code
          className={cn(
            "inline-flex min-w-0 items-center gap-2 rounded border bg-surface-base px-2.5 py-1 font-mono text-xs",
            hasRepo
              ? "border-accent-cyan/30 text-accent-cyan"
              : "border-border-subtle text-text-muted",
          )}
        >
          <StatusDot
            tone={hasRepo ? "cyan" : "muted"}
            label={hasRepo ? `repository ${repoId} loaded` : "no repository loaded"}
          />
          <span className="truncate">
            {hasRepo ? repoId : "no repository loaded"}
          </span>
        </code>
        <span
          className={cn(
            "hidden truncate font-mono text-[10px] uppercase tracking-[0.18em] lg:inline",
            hasRepo ? "text-text-muted" : "text-text-dim",
          )}
        >
          {hasRepo ? "· synced from url" : "· awaiting input"}
        </span>
      </div>

      {/* Right: status + primary action */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 lg:flex">
          <StatusDot tone="cyan" pulse label="shell ready" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
            shell ready
          </span>
        </div>

        <button
          type="button"
          disabled={!hasRepo}
          aria-label={
            hasRepo
              ? "Re-analyze the active repository"
              : "Re-analyze repository (disabled until a repository is loaded)"
          }
          className={cn(
            "inline-flex items-center gap-2 rounded border px-3 py-1.5",
            "font-mono text-[11px] uppercase tracking-[0.18em]",
            "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-0",
            hasRepo
              ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan shadow-glow-cyan hover:bg-accent-cyan/20"
              : "cursor-not-allowed border-border-subtle bg-surface-raised text-text-dim",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
          <span>re-analyze</span>
        </button>
      </div>
    </header>
  );
}
