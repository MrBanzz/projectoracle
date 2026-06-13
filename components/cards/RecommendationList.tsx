import { cn } from "@/lib/utils";

/**
 * Numbered list of human-readable recommendations for the AC-8
 * Impact Analysis panel.
 *
 * The list is rendered as an ordered `<ol>` so the numbering is
 * semantically correct (the AC-8 spec calls for a "numbered list"
 * and screen readers will announce the ordinal position). Each
 * item renders the recommendation text in a paragraph; monospaced
 * inline code (e.g. a module id inside the recommendation) is
 * rendered with the same token style used elsewhere in the panel.
 */

interface RecommendationListProps {
  /** 3-5 hand-written recommendations (mock data lives in lib/mock/impact.ts). */
  items: ReadonlyArray<string>;
  /** Optional caption override. */
  caption?: string;
  className?: string;
}

export function RecommendationList({
  items,
  caption = "Recommendations",
  className,
}: RecommendationListProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded border border-border-subtle bg-surface-raised/40 p-4",
          className,
        )}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          {caption}
        </p>
        <p className="mt-2 text-sm text-text-muted">
          No recommendations available for this module.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded border border-border-subtle bg-surface-raised/40",
        className,
      )}
    >
      <div className="border-b border-border-subtle px-4 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          {caption}
        </p>
      </div>
      <ol
        className="space-y-3 px-4 py-3"
        aria-label={`${items.length} recommendations for this module`}
      >
        {items.map((rec, index) => (
          <li
            key={`rec-${index}`}
            className="flex items-start gap-3 text-sm leading-relaxed text-text-primary"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center",
                "rounded-sm border border-accent-cyan/40 bg-accent-cyan/10",
                "font-mono text-[10px] font-semibold text-accent-cyan",
              )}
            >
              {index + 1}
            </span>
            <RecommendationText text={rec} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Renders a recommendation string, promoting any inline `code`-
 * style backticks to a real `<code>` element with the project's
 * monospaced token styling. This keeps the recommendations visually
 * consistent with the rest of the panel (e.g. "Add integration tests
 * for `services/payments` before refactoring `services/auth`").
 */
function RecommendationText({ text }: { text: string }) {
  // Split on backticks; alternating non-code / code segments.
  const segments = text.split(/(`[^`]+`)/g);
  return (
    <p>
      {segments.map((segment, i) => {
        const isCode = segment.startsWith("`") && segment.endsWith("`");
        if (isCode) {
          return (
            <code
              key={i}
              className="rounded-sm border border-border-subtle bg-surface-base/60 px-1 py-px font-mono text-[12px] text-accent-cyan"
            >
              {segment.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{segment}</span>;
      })}
    </p>
  );
}
