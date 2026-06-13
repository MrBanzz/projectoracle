import type {
  DepGraph,
  DepNode,
  ImpactReport,
  RiskLevel,
} from "@/lib/types";
import { DEFAULT_REPO_ID } from "@/lib/mock/repos";
import { getDependencies } from "@/lib/mock/dependencies";

/**
 * Per-repo keyed impact reports for AC-8.
 *
 * The catalog shape is `Record<repoId, Record<moduleId, ImpactReport>>` so
 * the panel can resolve the URL-synced `?module=<id>` to its report in
 * O(1) without re-walking the dep graph. The reports themselves are
 * computed at module-load time by walking each repo's `DepGraph`:
 *
 * - `direct`    = file paths in the modules that *directly* depend on
 *                 this one (the immediate downstream consumers). This
 *                 is what the AC-8 "blast radius" stat reads.
 * - `transitive` = file paths in the *transitive closure* of downstream
 *                 consumers (i.e. everyone who eventually depends on
 *                 this module, directly or not). This is what the
 *                 "transitively affected" stat reads.
 *
 * Risk and recommendations are *seeded* per module — they are hand-picked
 * to read like real engineering advice and to give the AC-8 panel a
 * good mix of LOW / MEDIUM / HIGH / CRITICAL cases. The file-path
 * lists are *computed* from the dep graph + the per-module `files`
 * count so they stay in lockstep with the AC-6 mock data.
 */

interface ImpactSeed {
  /** Risk level for the panel badge. */
  risk: RiskLevel;
  /**
   * 3-5 hand-written recommendations for the "What should the team do
   * before changing this module?" list. Read like real engineering
   * advice; templated strings are intentionally avoided.
   */
  recommendations: string[];
}

/** Slug pool used to mint plausible file paths under each module. */
const FILE_SLUGS = [
  "charge",
  "refund",
  "session",
  "token",
  "handler",
  "types",
  "schema",
  "config",
  "util",
  "error",
  "auth",
  "request",
  "response",
  "model",
  "view",
  "store",
  "cache",
  "queue",
  "worker",
  "pool",
  "client",
  "server",
  "router",
  "middleware",
  "guard",
  "fixture",
  "index",
  "constants",
  "helpers",
  "migrations",
];

function fileSlugFor(i: number): string {
  const base = FILE_SLUGS[i % FILE_SLUGS.length];
  return i < FILE_SLUGS.length ? base : `${base}_${Math.floor(i / FILE_SLUGS.length)}`;
}

/**
 * Generate `node.files` plausible file paths under a module. The first
 * file is always `<id>/index.ts` (the canonical entry point) and
 * every 5th file is a test file, so the lists read realistically.
 */
function filesForModule(node: DepNode): string[] {
  const out: string[] = [];
  for (let i = 0; i < node.files; i++) {
    if (i === 0) {
      out.push(`${node.id}/index.ts`);
    } else if (i % 5 === 0) {
      out.push(`${node.id}/${fileSlugFor(i)}.test.ts`);
    } else {
      out.push(`${node.id}/${fileSlugFor(i)}.ts`);
    }
  }
  return out;
}

/** Build a per-node `to -> [from]` inbound index from a `DepGraph`. */
function buildInboundIndex(graph: DepGraph): Map<string, string[]> {
  const inbound = new Map<string, string[]>();
  for (const node of graph.nodes) inbound.set(node.id, []);
  for (const edge of graph.edges) {
    const list = inbound.get(edge.to);
    if (list) list.push(edge.from);
  }
  return inbound;
}

/** Transitive closure of downstream consumers (DFS). */
function transitiveDependents(
  start: ReadonlyArray<string>,
  inbound: Map<string, string[]>,
): Set<string> {
  const visited = new Set<string>();
  const stack: string[] = [...start];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined || visited.has(id)) continue;
    visited.add(id);
    for (const child of inbound.get(id) ?? []) {
      if (!visited.has(child)) stack.push(child);
    }
  }
  return visited;
}

/** Build the file list for a set of module ids (in stable, sorted order). */
function filesForModules(
  graph: DepGraph,
  ids: Iterable<string>,
): string[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const out: string[] = [];
  for (const id of ids) {
    const node = byId.get(id);
    if (node === undefined) continue;
    out.push(...filesForModule(node));
  }
  out.sort();
  return out;
}

/** Build the full per-repo report catalog from a dep graph + seed map. */
function buildReports(
  graph: DepGraph,
  seeds: ReadonlyArray<readonly [string, ImpactSeed]>,
): Record<string, ImpactReport> {
  const seedById = new Map<string, ImpactSeed>(seeds);
  const inbound = buildInboundIndex(graph);
  const out: Record<string, ImpactReport> = {};

  for (const node of graph.nodes) {
    const seed = seedById.get(node.id);
    if (seed === undefined) {
      // Defensive: every dep node should have a seed. If a node is
      // missing, fall back to LOW + generic advice so the panel
      // still renders something useful.
      out[node.id] = {
        moduleId: node.id,
        risk: "LOW",
        direct: [],
        transitive: [],
        recommendations: [
          `No curated recommendations for \`${node.id}\` yet. Add a seed in lib/mock/impact.ts.`,
        ],
      };
      continue;
    }

    const directIds = inbound.get(node.id) ?? [];
    const transitiveIds = Array.from(transitiveDependents(directIds, inbound));
    const directFiles = filesForModules(graph, directIds);
    const transitiveFiles = filesForModules(graph, transitiveIds);

    out[node.id] = {
      moduleId: node.id,
      risk: seed.risk,
      direct: directFiles,
      transitive: transitiveFiles,
      recommendations: seed.recommendations,
    };
  }

  return out;
}

// ── acme/payments-platform seeds ─────────────────────────────────────────

const ACME_SEEDS: ReadonlyArray<readonly [string, ImpactSeed]> = [
  [
    "apps/web/pages/checkout",
    {
      risk: "HIGH",
      recommendations: [
        "Wrap the change in a feature flag and roll out to 1% of traffic first; the checkout page is a top-revenue surface.",
        "Coordinate the rollout with the on-call team during business hours — this page is on the P0 runbook.",
        "Cover the new behavior with end-to-end Playwright tests that exercise the full card-auth → ledger flow.",
      ],
    },
  ],
  [
    "apps/web/pages/dashboard",
    {
      risk: "MEDIUM",
      recommendations: [
        "Add a feature flag so the dashboard can be rolled back without a redeploy.",
        "Snapshot the dashboard's query patterns for 24h before shipping, so you can compare pre/post metrics.",
        "Cover the page with a smoke test that exercises the `services/ledger/reader` dependency.",
      ],
    },
  ],
  [
    "apps/web/components/CheckoutForm",
    {
      risk: "MEDIUM",
      recommendations: [
        "Snapshot the visual regression baseline before changing the form layout; the design system team owns the diff review.",
        "Verify the form still passes the WCAG 2.2 AA focus-order check after the change.",
        "Add a unit test for every new error state (card declined, 3DS challenge failed, network timeout).",
      ],
    },
  ],
  [
    "apps/web/hooks/useAuth",
    {
      risk: "MEDIUM",
      recommendations: [
        "Keep the hook's contract (return shape) backward compatible — the checkout page and middleware both call into it.",
        "Add a unit test for the session-refresh path; race conditions in token refresh are the #1 source of auth bugs.",
        "If the change adds a new auth state, update the type definition so TypeScript catches every consumer.",
      ],
    },
  ],
  [
    "apps/api/routes/charges",
    {
      risk: "HIGH",
      recommendations: [
        "Coordinate the rollout with the on-call team; this is the entry point for every payment.",
        "Add an integration test against the Stripe sandbox that exercises the new code path end-to-end.",
        "Make sure the new error mapping is reflected in the public API docs before the change ships.",
      ],
    },
  ],
  [
    "apps/api/routes/refunds",
    {
      risk: "HIGH",
      recommendations: [
        "Coordinate the rollout with the on-call team; refunds affect customer trust and the dispute-rate dashboard.",
        "Add an integration test that exercises the partial-refund + 3DS challenge path.",
        "Make sure the new error mapping is reflected in the public API docs before the change ships.",
      ],
    },
  ],
  [
    "apps/api/middleware/auth",
    {
      risk: "HIGH",
      recommendations: [
        "Audit every route that uses this middleware before changing the auth contract; a single missed route becomes a 401-spike incident.",
        "Coordinate the rollout with the on-call team during business hours; auth middleware is on the P0 runbook.",
        "Add a unit test for the new token-validation path; bypasses here are the #1 source of broken-auth incidents.",
      ],
    },
  ],
  [
    "services/payments/processor",
    {
      risk: "CRITICAL",
      recommendations: [
        "Coordinate the rollout with the on-call team; this is the heart of every payment flow.",
        "Run the full reconciliation suite in staging before promoting to production — a missed edge case here becomes a customer-balance drift.",
        "Snapshot the database before applying any schema change; the restore point should be < 5 min RPO.",
        "Add integration tests for every calling module (`apps/web/pages/checkout`, `apps/api/routes/charges`) before shipping.",
        "Update the on-call runbook to reflect the new service contract and the new error code mapping.",
      ],
    },
  ],
  [
    "services/payments/reconciler",
    {
      risk: "HIGH",
      recommendations: [
        "Coordinate the rollout with the on-call team; the reconciler feeds the finance-team's daily report.",
        "Run the reconciler in dry-run mode for 24h in production before enabling writes.",
        "Add an integration test that exercises the off-by-one boundary on date windows.",
      ],
    },
  ],
  [
    "services/auth/oidc",
    {
      risk: "CRITICAL",
      recommendations: [
        "Coordinate the rollout with the security team; auth changes are a P1 incident vector.",
        "Add integration tests for every calling module (`apps/web/hooks/useAuth`, `services/auth/sessions`) before shipping.",
        "Make sure the new token-validation path is reflected in the public SDK and the OIDC discovery document.",
        "Snapshot the active-session store before applying any schema change; a corrupt store here locks every user out.",
      ],
    },
  ],
  [
    "services/auth/sessions",
    {
      risk: "HIGH",
      recommendations: [
        "Coordinate the rollout with the security team; session invalidation mistakes here are user-visible.",
        "Add a unit test for the race between session-refresh and forced-logout (the #1 source of 'user can't log out' tickets).",
        "Run a canary in staging for 24h and watch the session-write rate before promoting to 100%.",
      ],
    },
  ],
  [
    "services/ledger/writer",
    {
      risk: "CRITICAL",
      recommendations: [
        "Coordinate the rollout with the finance team; the ledger is the source of truth for every balance.",
        "Snapshot the ledger database before applying any schema change; the restore point should be < 5 min RPO.",
        "Run the writer in dry-run mode for 24h in production before enabling writes; a missed edge case here becomes a balance drift.",
        "Add an integration test that exercises the concurrent-write + retry path; ledger writes are not idempotent by accident.",
        "Update the on-call runbook to reflect the new event format and the new error code mapping.",
      ],
    },
  ],
  [
    "services/ledger/reader",
    {
      risk: "CRITICAL",
      recommendations: [
        "Coordinate the rollout with the finance team; the reader is on the hot-path for every dashboard query.",
        "Run the reader against a shadow of production traffic for 24h before promoting; slow reads here become a dashboard-wide incident.",
        "Add a benchmark for the new query plan in the PR description; explain why the old plan was insufficient.",
      ],
    },
  ],
  [
    "packages/ui/primitives",
    {
      risk: "HIGH",
      recommendations: [
        "Bump the major version per semver — every consumer (`apps/web/components/CheckoutForm`, `packages/ui/forms`) will need to coordinate the upgrade.",
        "Document the breaking changes in the package's CHANGELOG before publishing the new version.",
        "Run the full visual-regression suite before publishing; primitives are the base of the design system.",
      ],
    },
  ],
  [
    "packages/ui/forms",
    {
      risk: "MEDIUM",
      recommendations: [
        "Bump the major version per semver if the change touches the public form contract.",
        "Document the breaking changes in the package's CHANGELOG before publishing the new version.",
        "Add a unit test for the new error-state path; the form is on the checkout hot-path.",
      ],
    },
  ],
  [
    "packages/db/postgres",
    {
      risk: "CRITICAL",
      recommendations: [
        "Snapshot the database before applying schema changes; the restore point should be < 5 min RPO.",
        "Run the migration in a canary environment first to catch lock contention and migration-order issues.",
        "Coordinate with the on-call DBA; the payments, ledger, and auth services all share this database.",
        "Add a database-side audit log for the new schema so the on-call team can see who changed what.",
        "Bump the major version per semver — every service that uses `pg` will need to coordinate the upgrade.",
      ],
    },
  ],
  [
    "packages/db/redis",
    {
      risk: "HIGH",
      recommendations: [
        "Snapshot the cache before applying schema changes; cache evictions here cause a 5x traffic spike at the upstream database.",
        "Coordinate the rollout with the on-call team; the auth middleware depends on the session store.",
        "Bump the major version per semver — `apps/api/middleware/auth` and `services/auth/sessions` both depend on this package.",
      ],
    },
  ],
  [
    "packages/utils/logger",
    {
      risk: "MEDIUM",
      recommendations: [
        "Keep the log-line format backward compatible; downstream log-parsers in the observability stack will break otherwise.",
        "Add a unit test for the new log fields; silent format drift is the #1 source of 'where did my logs go' tickets.",
        "Bump the minor version per semver if the change is purely additive.",
      ],
    },
  ],
  [
    "packages/utils/errors",
    {
      risk: "MEDIUM",
      recommendations: [
        "Keep the error-class hierarchy backward compatible; consumers branch on `instanceof` and a renamed class silently breaks them.",
        "Add a unit test for the new error code; silent error-code drift is the #1 source of 'why is the error type wrong' tickets.",
        "Bump the major version per semver if the change is breaking.",
      ],
    },
  ],
  [
    "infrastructure/k8s",
    {
      risk: "CRITICAL",
      recommendations: [
        "Coordinate the rollout with the platform team; shared infra changes are a P1 incident vector.",
        "Snapshot the cluster state before applying the change; the restore point should be < 5 min RPO.",
        "Update the disaster-recovery runbook to reflect the new infrastructure topology.",
        "Do not roll out during the weekly incident review window.",
      ],
    },
  ],
];

// ── stellar/orbit-ui seeds ───────────────────────────────────────────────

const STELLAR_SEEDS: ReadonlyArray<readonly [string, ImpactSeed]> = [
  [
    "apps/web/components/MetricCard",
    {
      risk: "LOW",
      recommendations: [
        "Cover the new metric format with a unit test; the dashboard uses these cards on every page load.",
        "Snapshot the visual regression baseline before changing the layout.",
        "Verify the new metric series is documented in the runbook so the on-call team knows what the numbers mean.",
      ],
    },
  ],
  [
    "apps/web/components/TraceView",
    {
      risk: "MEDIUM",
      recommendations: [
        "Add a unit test for the trace-stitching path; missed edge cases here become 'why is my trace split' tickets.",
        "Coordinate the rollout with the on-call team; the trace view is on the incident-response hot-path.",
        "Benchmark the new render path against a 10k-span trace in the PR description.",
      ],
    },
  ],
  [
    "apps/web/components/LogTable",
    {
      risk: "MEDIUM",
      recommendations: [
        "Add a unit test for the filter-stitching path; filter drift here becomes 'where did my logs go' tickets.",
        "Benchmark the new render path against a 1M-log dataset in the PR description.",
        "Snapshot the table's scroll-position behavior in the Playwright suite so a layout refactor doesn't break 'jump back to my filtered range'.",
      ],
    },
  ],
  [
    "apps/web/hooks/useMetrics",
    {
      risk: "MEDIUM",
      recommendations: [
        "Keep the hook's contract (return shape) backward compatible; the dashboard depends on it.",
        "Add a unit test for the polling interval change; silent polling drift is the #1 source of stale-dashboard tickets.",
        "If the change adds a new query parameter, ship a Sentry capture for query-parse failures so we can spot bad input in production.",
      ],
    },
  ],
  [
    "apps/ingest/agents/host",
    {
      risk: "MEDIUM",
      recommendations: [
        "Coordinate the rollout with the on-call team; the host agent is on every production box.",
        "Run the new agent in dry-run mode for 24h in production before enabling real ingestion.",
        "Add a SLO alert on the agent's heartbeat / scrape-success rate; a silent agent is the #1 source of 'why is this box missing from the dashboard' tickets.",
      ],
    },
  ],
  [
    "apps/ingest/agents/k8s",
    {
      risk: "MEDIUM",
      recommendations: [
        "Coordinate the rollout with the platform team; the k8s agent runs with cluster-admin RBAC.",
        "Run the new agent in dry-run mode for 24h in production before enabling real ingestion.",
        "Restrict the agent's ClusterRole to read-only resources in the new version; the audit team will ask about any new write scopes.",
      ],
    },
  ],
  [
    "apps/ingest/agents/syslog",
    {
      risk: "MEDIUM",
      recommendations: [
        "Coordinate the rollout with the on-call team; the syslog agent is on every production box.",
        "Run the new agent in dry-run mode for 24h in production before enabling real ingestion.",
        "Add a backpressure metric (per-host queue depth) so a runaway source can't OOM the agent — the syslog format is famously easy to misuse.",
      ],
    },
  ],
  [
    "apps/cli/commands/query",
    {
      risk: "LOW",
      recommendations: [
        "Add a unit test for the new flag; CLI flag drift is the #1 source of 'this option doesn't work' issues.",
        "Bump the minor version per semver.",
        "Update the CLI's `--help` text in the same PR; silent help-text drift is the #1 source of 'this option doesn't appear in --help' tickets.",
      ],
    },
  ],
  [
    "services/collector/ingestor",
    {
      risk: "HIGH",
      recommendations: [
        "Coordinate the rollout with the on-call team; the ingestor is the entry point for every metric.",
        "Run the new ingestor against a shadow of production traffic for 24h before promoting.",
        "Add an integration test that exercises the backpressure / circuit-breaker path.",
      ],
    },
  ],
  [
    "services/collector/buffer",
    {
      risk: "MEDIUM",
      recommendations: [
        "Benchmark the new buffer size against the peak-traffic profile in the PR description.",
        "Coordinate the rollout with the on-call team; buffer overflow here becomes a data-loss incident.",
        "Add a saturated-buffer alert that pages 10 minutes before the buffer is full; the metric should be wired into the on-call dashboard before the change ships.",
      ],
    },
  ],
  [
    "services/query/engine",
    {
      risk: "CRITICAL",
      recommendations: [
        "Coordinate the rollout with the on-call team; the query engine is on every dashboard hot-path.",
        "Run the new engine against a shadow of production traffic for 24h before promoting.",
        "Add a benchmark for the new query plan in the PR description; explain why the old plan was insufficient.",
        "Snapshot the cache before applying schema changes; cache evictions here cause a 5x traffic spike at the upstream.",
      ],
    },
  ],
  [
    "services/query/cache",
    {
      risk: "MEDIUM",
      recommendations: [
        "Benchmark the new cache size against the peak-traffic profile in the PR description.",
        "Coordinate the rollout with the on-call team; cache evictions here cause a 5x traffic spike at the query engine.",
        "Add a cache-hit-rate SLO and wire it into the on-call dashboard; a silently-degrading cache is the #1 source of 'queries got slow today' tickets.",
      ],
    },
  ],
  [
    "services/alerts/evaluator",
    {
      risk: "HIGH",
      recommendations: [
        "Coordinate the rollout with the on-call team; alert misfires here are immediately user-visible.",
        "Run the new evaluator against a shadow of production traffic for 24h before promoting.",
        "Add a unit test for the new alert rule; silent alert-rule drift is the #1 source of 'why didn't this fire' tickets.",
      ],
    },
  ],
  [
    "services/alerts/notifier",
    {
      risk: "HIGH",
      recommendations: [
        "Coordinate the rollout with the on-call team; notification misroutes here are immediately user-visible.",
        "Add a unit test for the new notification channel; channel drift here is the #1 source of 'I never got paged' tickets.",
        "Add a synthetic-alert test in the staging environment so every channel is exercised end-to-end before the change ships; pages that silently fail to deliver are the #1 source of 'why didn't the on-call team respond' incidents.",
      ],
    },
  ],
  [
    "packages/db/timeseries",
    {
      risk: "CRITICAL",
      recommendations: [
        "Snapshot the timeseries database before applying schema changes; the restore point should be < 5 min RPO.",
        "Run the migration in a canary environment first to catch lock contention and migration-order issues.",
        "Coordinate with the on-call team; the collector, query, and alerts services all share this database.",
        "Bump the major version per semver — every service that writes time-series will need to coordinate the upgrade.",
      ],
    },
  ],
  [
    "packages/db/objectstore",
    {
      risk: "HIGH",
      recommendations: [
        "Snapshot the object store before applying schema changes; the restore point should be < 5 min RPO.",
        "Coordinate the rollout with the on-call team; the buffer, query cache, and trace view all share this store.",
        "Bump the major version per semver.",
      ],
    },
  ],
  [
    "packages/utils/logger",
    {
      risk: "MEDIUM",
      recommendations: [
        "Keep the log-line format backward compatible; downstream log-parsers in the observability stack will break otherwise.",
        "Add a unit test for the new log fields; silent format drift is the #1 source of 'where did my logs go' tickets.",
        "Coordinate with the on-call team before removing any existing log field; an old dashboard alert that still expects the field will fire incorrectly and waste triage time.",
      ],
    },
  ],
  [
    "infrastructure/observability",
    {
      risk: "HIGH",
      recommendations: [
        "Coordinate the rollout with the platform team; shared observability infra is on the P0 runbook.",
        "Snapshot the cluster state before applying the change.",
        "Update the on-call runbook to reflect the new topology.",
      ],
    },
  ],
];

// ── Static seed validation ───────────────────────────────────────────────

/**
 * AC-8 spec: "a numbered list of 3-5 human-readable recommendations".
 *
 * The validation runs at module-load time so any seed that falls
 * outside the [3, 5] range throws an `Error` and the build /
 * server start fails loudly. This is intentionally a hard fail
 * rather than a console warning — silent violations are exactly
 * what AC-8 is trying to prevent.
 *
 * The check walks every seed in both repos and:
 *  - asserts `recommendations.length` is in [MIN, MAX]
 *  - asserts every recommendation is a non-empty string
 *
 * If a future maintainer adds a seed (e.g. a new repo or a new
 * module), this check automatically runs over it; no manual review
 * step is required to keep the demo spec-clean.
 */
const REC_MIN = 3;
const REC_MAX = 5;

function validateSeeds(
  label: string,
  seeds: ReadonlyArray<readonly [string, ImpactSeed]>,
): void {
  for (const [moduleId, seed] of seeds) {
    const count = seed.recommendations.length;
    if (count < REC_MIN || count > REC_MAX) {
      throw new Error(
        `[lib/mock/impact.ts] ${label} seed for "${moduleId}" has ${count} recommendations; AC-8 spec requires ${REC_MIN}-${REC_MAX}.`,
      );
    }
    seed.recommendations.forEach((rec, index) => {
      if (typeof rec !== "string" || rec.trim().length === 0) {
        throw new Error(
          `[lib/mock/impact.ts] ${label} seed for "${moduleId}" has an empty recommendation at index ${index}.`,
        );
      }
    });
  }
}

validateSeeds("acme/payments-platform", ACME_SEEDS);
validateSeeds("stellar/orbit-ui", STELLAR_SEEDS);

// ── Catalog ──────────────────────────────────────────────────────────────

/**
 * Build the per-repo report catalog at module-load time. The seeds
 * are matched to repos by checking which `DepGraph` contains each
 * module id, so the seeds are decoupled from the dep mock's internal
 * id scheme.
 */
function buildCatalog(): Record<string, Record<string, ImpactReport>> {
  const result: Record<string, Record<string, ImpactReport>> = {};
  for (const repoId of ["acme/payments-platform", "stellar/orbit-ui"] as const) {
    const graph = getDependencies(repoId);
    if (graph === undefined) continue;
    const seedPool = repoId === "acme/payments-platform" ? ACME_SEEDS : STELLAR_SEEDS;
    const repoSeeds = seedPool.filter(([moduleId]) =>
      graph.nodes.some((n) => n.id === moduleId),
    );
    if (repoSeeds.length === 0) continue;
    result[repoId] = buildReports(graph, repoSeeds);
  }
  return result;
}

/**
 * The id-keyed catalog of impact-report maps. The outer key is the
 * repo id, the inner key is the module id.
 */
export const IMPACT_REPORTS: Record<string, Record<string, ImpactReport>> =
  buildCatalog();

/**
 * Resolve a `?repo=owner/name` + `?module=<id>` pair to its
 * `ImpactReport`. Returns `undefined` for unknown repos or modules;
 * callers (the `ImpactAnalysis` panel) must handle that explicitly.
 */
export function getImpact(
  repoId: string | null,
  moduleId: string | null,
): ImpactReport | undefined {
  if (repoId === null || moduleId === null) return undefined;
  return IMPACT_REPORTS[repoId]?.[moduleId];
}
