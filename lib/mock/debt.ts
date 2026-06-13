import type { DebtItem } from "@/lib/types";
import { DEFAULT_REPO_ID } from "@/lib/mock/repos";

/**
 * Per-repo top-5 tech-debt items for the AC-9 panel.
 *
 * Shape: `Record<repoId, DebtItem[]>` so the panel can resolve the
 * URL-synced `?repo=` to its list in O(1). Every list is exactly 5
 * items long, hand-picked to read like real engineering notes and to
 * give the AC-9 sortable header a mix of LOW / MEDIUM / HIGH severities
 * and all five category buckets.
 */

const ACME_DEBT: ReadonlyArray<DebtItem> = [
  {
    id: "acme-debt-1",
    title: "Refunds flow has duplicated 3DS challenge logic",
    category: "Duplication",
    severity: "HIGH",
    description:
      "The 3DS challenge handler in `apps/api/routes/charges` and `apps/api/routes/refunds` is copy-pasted; one change to the auth flow requires edits in both files.",
  },
  {
    id: "acme-debt-2",
    title: "Ledger writer has cyclomatic complexity of 47",
    category: "Complexity",
    severity: "HIGH",
    description:
      "`services/ledger/writer` has 6 nested conditionals and 4 early-return paths; the unit test count lags the branch count by 23.",
  },
  {
    id: "acme-debt-3",
    title: "Auth middleware is missing tests for the SSO callback path",
    category: "Coverage",
    severity: "MEDIUM",
    description:
      "The SSO callback branch in `apps/api/middleware/auth` has 0% line coverage; the rest of the file averages 81%.",
  },
  {
    id: "acme-debt-4",
    title: "Stripe SDK is pinned to a 14-month-old major version",
    category: "Outdated Deps",
    severity: "MEDIUM",
    description:
      "`packages/utils/payments` pins `stripe@13.4.0`; the current major (15.x) ships a typed-error refactor that simplifies the refund path.",
  },
  {
    id: "acme-debt-5",
    title: "Session-refresh race can be exploited for forced-logout",
    category: "Security",
    severity: "HIGH",
    description:
      "`services/auth/sessions` reads-then-writes the session record without a row lock; a concurrent forced-logout can leak one tick of access.",
  },
];

const STELLAR_DEBT: ReadonlyArray<DebtItem> = [
  {
    id: "stellar-debt-1",
    title: "Trace stitching is O(n²) over the span id index",
    category: "Complexity",
    severity: "HIGH",
    description:
      "`apps/web/components/TraceView` rebuilds the span index from scratch on every render; 10k-span traces stall the main thread for ~1.4s.",
  },
  {
    id: "stellar-debt-2",
    title: "Log filter parsing is duplicated across CLI and web",
    category: "Duplication",
    severity: "MEDIUM",
    description:
      "`apps/cli/commands/query` and `apps/web/components/LogTable` both ship a copy of the filter parser; new operators must be added in two places.",
  },
  {
    id: "stellar-debt-3",
    title: "Time-series write path is at 62% line coverage",
    category: "Coverage",
    severity: "MEDIUM",
    description:
      "`services/query/engine` has 38% coverage on the retry path; the rest of the file averages 88%.",
  },
  {
    id: "stellar-debt-4",
    title: "TimescaleDB extension is 2 minor versions behind",
    category: "Outdated Deps",
    severity: "LOW",
    description:
      "`packages/db/timeseries` targets TimescaleDB 2.10; 2.14 ships continuous aggregates-on-write that would cut the dashboard query path in half.",
  },
  {
    id: "stellar-debt-5",
    title: "Alert evaluator allows arbitrary user-supplied regexes",
    category: "Security",
    severity: "HIGH",
    description:
      "`services/alerts/evaluator` constructs a `new RegExp()` from the rule body without length or complexity caps; a ReDoS payload can stall the evaluator thread.",
  },
];

/**
 * The id-keyed catalog of top-5 debt lists. The outer key is the
 * repo id; every list is exactly 5 items long.
 */
export const DEBT: Record<string, ReadonlyArray<DebtItem>> = {
  "acme/payments-platform": ACME_DEBT,
  "stellar/orbit-ui": STELLAR_DEBT,
};

/**
 * Resolve a `?repo=owner/name` value to its top-5 debt list.
 * Falls back to the default repo's list so the panel never renders
 * an empty list when the user lands on `/` with no `?repo=`.
 */
export function getDebt(repoId: string | null): ReadonlyArray<DebtItem> {
  if (repoId !== null && DEBT[repoId] !== undefined) return DEBT[repoId]!;
  return DEBT[DEFAULT_REPO_ID]!;
}
