import type { RepoData } from "@/lib/types";

/**
 * The id used when a user lands on `/` without `?repo=…`, or when they fall
 * back from an unknown repo. Picked deterministically so the demo always
 * boots to the same starting point.
 */
export const DEFAULT_REPO_ID = "acme/payments-platform";

/**
 * The id-based catalog of every seeded demo repository.
 *
 * `Record<string, RepoData>` lets the lookup be `REPOS[repoId] ?? undefined`,
 * which is what `getRepo()` returns and what the AC-10 empty-state will
 * branch on.
 */
export const REPOS: Record<string, RepoData> = {
  "acme/payments-platform": {
    id: "acme/payments-platform",
    fullName: "acme/payments-platform",
    description:
      "Distributed payments platform for global merchants. Card auth, settlement, and ledger across 14 regions.",
    languages: [
      { name: "TypeScript", pct: 62 },
      { name: "Go", pct: 22 },
      { name: "Python", pct: 9 },
      { name: "Shell", pct: 4 },
      { name: "Other", pct: 3 },
    ],
    totals: { files: 4_182, modules: 47 },
    health: {
      score: 78,
      complexity: 32,
      debtIndex: 41,
      coverage: 73,
      deltas: { score: +2, complexity: -1, debtIndex: -3, coverage: +1 },
    },
    analyzedAt: "2026-06-12T08:14:00Z",
  },

  "stellar/orbit-ui": {
    id: "stellar/orbit-ui",
    fullName: "stellar/orbit-ui",
    description:
      "Real-time observability dashboard for distributed systems. Metrics, traces, and log search in a single pane.",
    languages: [
      { name: "TypeScript", pct: 78 },
      { name: "Rust", pct: 12 },
      { name: "SCSS", pct: 6 },
      { name: "Other", pct: 4 },
    ],
    totals: { files: 1_824, modules: 28 },
    health: {
      score: 84,
      complexity: 24,
      debtIndex: 28,
      coverage: 81,
      deltas: { score: -1, complexity: +2, debtIndex: +1, coverage: -2 },
    },
    analyzedAt: "2026-06-12T17:42:00Z",
  },
};

/**
 * Resolve a `?repo=owner/name` value to its mock dataset entry.
 *
 * Returns `undefined` when the id is not in the seeded catalog; callers
 * (the AC-10 empty state) must handle that case explicitly.
 */
export function getRepo(repoId: string | null): RepoData | undefined {
  if (repoId === null) return undefined;
  return REPOS[repoId];
}

/** Every seeded repo id, in display order. */
export const REPO_IDS = Object.keys(REPOS);
