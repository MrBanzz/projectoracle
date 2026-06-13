/**
 * GitHub repository URL parser.
 *
 * The accepted shape is the plan-mandated regex
 *   `^https?://github\.com/[\w.-]+/[\w.-]+/?(\.git)?$`
 * which tolerates `http`/`https`, owner and repo names containing word
 * characters, dots, and dashes, an optional trailing slash, and an optional
 * `.git` suffix.
 *
 * Returns a discriminated result so callers must explicitly handle the
 * invalid case (no thrown errors, no silent fallbacks).
 */

export interface ParsedRepo {
  /** Always "ok" when present. */
  ok: true;
  /** The owner segment, e.g. "acme". */
  owner: string;
  /** The repository name (without any `.git` suffix), e.g. "payments-platform". */
  repo: string;
  /** The canonical `owner/repo` id used in URL params. */
  id: string;
}

export interface InvalidRepo {
  /** Always "ok: false" when present. */
  ok: false;
  /** Human-readable error message safe to render in the UI. */
  error: string;
}

export type ParseResult = ParsedRepo | InvalidRepo;

export const INVALID_REPO_MESSAGE = "Enter a valid GitHub repository URL.";

/**
 * Strict regex matching the AC-3 success signal. This regex is used to
 * *validate* that the input has the right shape; the actual `owner` and
 * `repo` values are extracted via the WHATWG `URL` parser to avoid the
 * classic `[\w.-]+` greedy-vs-`.git`-suffix pitfall.
 */
const REPO_URL_REGEX =
  /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?(\.git)?$/;

/**
 * Parse a GitHub repository URL into its owner and repo segments.
 *
 * The parser is pure and has no side effects; it does not touch `window`,
 * `location`, or any router. Callers decide how to surface errors and where
 * to navigate on success.
 *
 * @example
 *   parseRepoUrl("https://github.com/acme/payments-platform")
 *   // { ok: true, owner: "acme", repo: "payments-platform", id: "acme/payments-platform" }
 *
 *   parseRepoUrl("not-a-url")
 *   // { ok: false, error: "Enter a valid GitHub repository URL." }
 */
export function parseRepoUrl(input: string): ParseResult {
  const trimmed = input.trim();

  if (trimmed === "") {
    return { ok: false, error: INVALID_REPO_MESSAGE };
  }

  if (!REPO_URL_REGEX.test(trimmed)) {
    return { ok: false, error: INVALID_REPO_MESSAGE };
  }

  // The URL is well-formed and matches the strict regex. Use the WHATWG URL
  // parser to extract path segments — this is more reliable than a single
  // regex with multiple capture groups, because `[\w.-]+` greedily consumes
  // the `.git` suffix when it sits at the end of the repo segment.
  let pathname: string;
  try {
    pathname = new URL(trimmed).pathname;
  } catch {
    return { ok: false, error: INVALID_REPO_MESSAGE };
  }

  const parts = pathname.split("/").filter((segment) => segment.length > 0);
  if (parts.length !== 2) {
    // The regex already guarantees exactly 2 segments; this is defensive.
    return { ok: false, error: INVALID_REPO_MESSAGE };
  }

  const owner = parts[0];
  const repoWithOptionalGit = parts[1];
  const repo = repoWithOptionalGit.endsWith(".git")
    ? repoWithOptionalGit.slice(0, -".git".length)
    : repoWithOptionalGit;

  return {
    ok: true,
    owner,
    repo,
    id: `${owner}/${repo}`,
  };
}
