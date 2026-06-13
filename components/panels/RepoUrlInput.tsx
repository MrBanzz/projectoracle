"use client";

import { type FormEvent, useId, useState } from "react";
import { useRepoSelection } from "@/lib/state/selection";
import { INVALID_REPO_MESSAGE, parseRepoUrl } from "@/lib/parse/repoUrl";
import { cn } from "@/lib/utils";

/**
 * GitHub URL input panel. Accepts a string of the form
 * `https://github.com/<owner>/<repo>` (tolerating trailing slashes and
 * `.git`), validates it client-side, and on submit pushes `?repo=<owner>/<repo>`
 * to the URL. Invalid input renders an inline error and does NOT navigate.
 */
export function RepoUrlInput() {
  const { repoId, setRepo } = useRepoSelection();
  const inputId = useId();
  const errorId = useId();

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;

  const onChange = (next: string) => {
    setValue(next);
    if (error !== null) setError(null);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(INVALID_REPO_MESSAGE);
      return;
    }
    const result = parseRepoUrl(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setRepo(result.id);
    setValue("");
  };

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="rounded-lg border border-border-subtle bg-surface-panel p-6"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
          01 · Repository
        </p>
        {repoId ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-cyan">
            active · {repoId}
          </p>
        ) : (
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
            awaiting input
          </p>
        )}
      </header>

      <h2
        id={`${inputId}-heading`}
        className="mt-2 text-lg font-semibold text-text-primary"
      >
        Analyze a GitHub repository
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Paste a public <code className="font-mono text-text-primary">https://github.com/&lt;owner&gt;/&lt;repo&gt;</code> URL.
        The repo must be one of the seeded demo repositories.
      </p>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <label htmlFor={inputId} className="flex-1">
          <span className="sr-only">GitHub repository URL</span>
          <input
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://github.com/owner/repo"
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "block w-full rounded border bg-surface-base px-3 py-2",
              "font-mono text-sm text-text-primary placeholder:text-text-dim",
              "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan",
              error
                ? "border-accent-rose focus-visible:ring-accent-rose"
                : "border-border-subtle",
            )}
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded border px-4 py-2",
            "font-mono text-[11px] uppercase tracking-[0.18em]",
            "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-0",
            canSubmit
              ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan shadow-glow-cyan"
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
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
          <span>Analyze</span>
        </button>
      </form>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 inline-flex items-center gap-2 font-mono text-xs text-accent-rose"
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
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <span>{error}</span>
        </p>
      ) : (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
          accepts · https://github.com/&lt;owner&gt;/&lt;repo&gt; (trailing slash and .git optional)
        </p>
      )}
    </section>
  );
}
