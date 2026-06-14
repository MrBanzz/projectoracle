/**
 * Cross-cutting types for the ProjectOracle mock data layer.
 *
 * Types defined here are referenced by both the mock datasets and the
 * presentation components. They are intentionally narrow: anything that
 * varies per-repo belongs on the data side, anything that varies per-render
 * belongs on the component side.
 */

// ── Shared enums ──────────────────────────────────────────────────────────

/** Risk levels used by Impact (AC-8) and Tech Debt severity (AC-9). */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Severity ratings used by the Tech Debt panel (AC-9). */
export type DebtSeverity = "LOW" | "MEDIUM" | "HIGH";

/** Tech-debt category buckets. */
export type DebtCategory =
  | "Complexity"
  | "Duplication"
  | "Coverage"
  | "Outdated Deps"
  | "Security";

/** Architecture-layer kind, used to color ArchNodes (AC-5). */
export type ArchLayer =
  | "apps"
  | "services"
  | "packages"
  | "infrastructure";

// ── Repository overview (AC-4) ────────────────────────────────────────────

/** A single language slice in the repo's language breakdown. */
export interface RepoLanguage {
  /** Canonical language name, e.g. "TypeScript". */
  name: string;
  /** 0–100; the slices should sum to 100. */
  pct: number;
}

/** Per-metric trend deltas (point changes, not percentages). */
export interface HealthDeltas {
  score: number;
  complexity: number;
  debtIndex: number;
  coverage: number;
}

/** The 4-card health row on the Repo Overview panel. */
export interface RepoHealth {
  /** 0–100 composite health score. */
  score: number;
  /** 0–100 average cyclomatic complexity (lower is better). */
  complexity: number;
  /** 0–100 tech-debt index (lower is better). */
  debtIndex: number;
  /** 0–100 test coverage (higher is better). */
  coverage: number;
  /** Per-metric trend deltas. */
  deltas: HealthDeltas;
}

export interface RepoTotals {
  /** Total source files (excluding vendored / generated). */
  files: number;
  /** Total distinct modules (per the dependency graph). */
  modules: number;
}

/** The full mock dataset entry for one repository. */
export interface RepoData {
  /** "owner/name" id used in URL params. */
  id: string;
  /** Human-readable full name; usually the same as `id`. */
  fullName: string;
  /** One-line description. */
  description: string;
  /** Language breakdown, ordered by `pct` descending. */
  languages: RepoLanguage[];
  totals: RepoTotals;
  health: RepoHealth;
  /** ISO 8601 timestamp of the last analysis run. */
  analyzedAt: string;
}

// ── Architecture map (AC-5) ───────────────────────────────────────────────

export interface ArchNode {
  id: string;
  label: string;
  layer: ArchLayer;
  /** Hand-laid x/y position in pixels for the React Flow viewport. */
  position: { x: number; y: number };
}

export type ArchEdgeKind = "calls" | "depends-on" | "owns";

export interface ArchEdge {
  from: string;
  to: string;
  kind: ArchEdgeKind;
}

export interface ArchGraph {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

// ── Dependency graph (AC-6) ───────────────────────────────────────────────

export interface DepNode {
  id: string;
  label: string;
  /** Number of source files in this module. */
  files: number;
  /** Inbound dependency count (modules that import this one). */
  inCount: number;
  /** Outbound dependency count (modules this one imports). */
  outCount: number;
  /** Architectural layer; reused for color consistency with AC-5. */
  layer: ArchLayer;
  /** Hand-laid x/y position in pixels. */
  position: { x: number; y: number };
}

export interface DepEdge {
  from: string;
  to: string;
}

export interface DepGraph {
  nodes: DepNode[];
  edges: DepEdge[];
}

// ── Impact analysis (AC-8) ────────────────────────────────────────────────

export interface ImpactReport {
  moduleId: string;
  risk: RiskLevel;
  /** File paths directly affected by a change to this module. */
  direct: string[];
  /** File paths transitively affected (i.e. via dependents). */
  transitive: string[];
  /** 3–5 human-readable recommendations. */
  recommendations: string[];
}

// ── Tech debt summary (AC-9) ─────────────────────────────────────────────

export interface DebtItem {
  id: string;
  title: string;
  category: DebtCategory;
  severity: DebtSeverity;
  description: string;
}
