"use client";

import { useSearchParams } from "next/navigation";
import { DEFAULT_REPO_ID, REPOS, REPO_IDS } from "@/lib/mock/repos";

/**
 * Page-level guard for the AC-10 unknown-repo empty state.
 *
 * Reads `?repo=` from the URL; when the value is non-null and not in
 * the `REPOS` catalog, renders a single, full-width "Repository not in
 * demo catalog" card with:
 *   - the unknown repo id
 *   - a "Try a sample repo" button for each seeded repo
 *   - a "Clear ?repo=" link that falls back to the default
 *
 * When the value is null (no `?repo=` at all) or matches a seeded
 * repo, the gate renders its `children` unchanged. The per-panel
 * `UnknownRepoState` branches are kept as defensive fallbacks for the
 * case where a downstream panel is rendered in isolation.
 */
export function UnknownRepoFallback({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const repoId = searchParams.get("repo");

  // No ?repo= set → the "awaiting" panels handle the empty case; render normally.
  if (repoId === null) return <>{children}</>;

  // ?repo=foo/bar matches a seeded entry → render normally.
  if (REPOS[repoId] !== undefined) return <>{children}</>;

  return <UnknownRepoCard repoId={repoId} />;
}

function UnknownRepoCard({ repoId }: { repoId: string }) {
  // Render the seeded sample buttons in the order they appear in REPO_IDS
  // (the default first, then any others), so the demo is reproducible.
  const samples = [DEFAULT_REPO_ID, ...REPO_IDS.filter((id) => id !== DEFAULT_REPO_ID)];

  return (
    <section
      aria-label="Repository not in demo catalog"
      className="rounded-lg border border-dashed border-accent-rose/40 bg-surface-panel/60 p-8 sm:p-10"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-rose">
        01 · Repository · unknown
      </p>
      <h2 className="mt-3 font-mono text-lg text-text-primary sm:text-xl">
        Repository not in demo catalog
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-text-muted">
        <code className="font-mono text-accent-cyan">{repoId}</code> is not in
        the seeded demo. Try one of the two sample repos below, or clear the
        URL param to load the default catalog entry.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {samples.map((id) => (
          <a
            key={id}
            href={`/?repo=${id}`}
            className="inline-flex items-center gap-2 rounded-sm border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-accent-cyan transition-colors hover:bg-accent-cyan/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            <span aria-hidden="true">→</span>
            <span>?repo={id}</span>
          </a>
        ))}
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-base/60 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-text-muted transition-colors hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        >
          <span aria-hidden="true">×</span>
          <span>clear ?repo=</span>
        </a>
      </div>
    </section>
  );
}
