import { Suspense } from "react";
import { ArchitectureMap } from "@/components/panels/ArchitectureMap";
import { DependencyGraph } from "@/components/panels/DependencyGraph";
import { ImpactAnalysis } from "@/components/panels/ImpactAnalysis";
import { RepoOverview } from "@/components/panels/RepoOverview";
import { RepoUrlInput } from "@/components/panels/RepoUrlInput";
import { TechDebtSummary } from "@/components/panels/TechDebtSummary";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { UnknownRepoFallback } from "@/components/shell/UnknownRepoFallback";

// The dashboard reads `?repo=` and `?module=` from the URL via
// `useSearchParams` in client components. The page therefore cannot be
// statically prerendered; it must be server-rendered on demand.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="grid min-h-screen grid-cols-[auto_1fr] grid-rows-[auto_1fr] bg-surface-base">
      <Sidebar />
      <Suspense fallback={null}>
        <TopBar />
      </Suspense>

      <main className="min-w-0 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-4 pb-8 lg:px-8">
          <Suspense fallback={null}>
            <RepoUrlInput />
          </Suspense>

          {/* AC-10: page-level guard for unknown repos. When the
              `?repo=` value is not in the catalog, this renders a
              full-width "Repository not in demo catalog" empty state
              with sample-repo buttons + a clear-param link. When
              `?repo=` is null or matches a seeded entry, it renders
              the five panels unchanged. The per-panel
              UnknownRepoState branches are kept as defensive
              fallbacks for the case where a panel is rendered in
              isolation. */}
          <Suspense fallback={null}>
            <UnknownRepoFallback>
              <PanelSlot label="02 · Repository" aria="Loading repository overview">
                <RepoOverview />
              </PanelSlot>
              {/* AC-11: the two React Flow panels live in a 2-col
                  grid at the `lg` breakpoint (≥1024px) and stack to
                  a single column below it. The grid lives in a
                  `<div>` rather than re-wrapping the slots so the
                  per-slot Suspense fallbacks still work independently. */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <PanelSlot label="03 · Architecture Map" aria="Loading architecture map">
                  <ArchitectureMap />
                </PanelSlot>
                <PanelSlot label="04 · Dependency Graph" aria="Loading dependency graph">
                  <DependencyGraph />
                </PanelSlot>
              </div>
              <PanelSlot label="05 · Impact Analysis" aria="Loading impact analysis">
                <ImpactAnalysis />
              </PanelSlot>
              <PanelSlot label="06 · Tech Debt Summary" aria="Loading tech debt summary">
                <TechDebtSummary />
              </PanelSlot>
            </UnknownRepoFallback>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

// Tiny per-panel Suspense wrapper that preserves each panel's
// individual loading state when rendered inside the UnknownRepoFallback.
function PanelSlot({
  label,
  aria,
  children,
}: {
  label: string;
  aria: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <section
          aria-label={aria}
          className="rounded-lg border border-dashed border-border-subtle bg-surface-panel/40 p-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
            {label}
          </p>
          <p className="mt-2 font-mono text-xs text-text-dim">loading…</p>
        </section>
      }
    >
      {children}
    </Suspense>
  );
}
