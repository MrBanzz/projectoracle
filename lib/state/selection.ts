"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface RepoSelection {
  /** `?repo=owner/name` value, or `null` when not set. */
  repoId: string | null;
  /** `?module=...` value, or `null` when not set. Wired in AC-7. */
  moduleId: string | null;
  /** Set or replace the active repository id. Triggers a router push. */
  setRepo: (id: string) => void;
  /** Set, replace, or clear the active module id. Wired in AC-7. */
  setModule: (id: string | null) => void;
}

/**
 * URL-synced selection state for the active repository and module.
 *
 * The URL is the single source of truth. Components read `repoId` /
 * `moduleId` from this hook and never duplicate the value in local state.
 * `setRepo` / `setModule` produce a new search-param string and push it via
 * the App Router, so the back button works and the same URL is shareable.
 */
export function useRepoSelection(): RepoSelection {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const repoId = searchParams.get("repo");
  const moduleId = searchParams.get("module");

  const setRepo = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("repo", id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const setModule = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === null) {
        params.delete("module");
      } else {
        params.set("module", id);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return useMemo(
    () => ({ repoId, moduleId, setRepo, setModule }),
    [repoId, moduleId, setRepo, setModule],
  );
}
