import { Suspense } from "react";
import { ArchitectureMap } from "@/components/panels/ArchitectureMap";
import { DependencyGraph } from "@/components/panels/DependencyGraph";
import { ImpactAnalysis } from "@/components/panels/ImpactAnalysis";
import { RepoOverview } from "@/components/panels/RepoOverview";
import { RepoUrlInput } from "@/components/panels/RepoUrlInput";
import { TechDebtSummary } from "@/components/panels/TechDebtSummary";
import { ErrorBoundary } from "@/components/shell/ErrorBoundary";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { UnknownRepoFallback } from "@/components/shell/UnknownRepoFallback";

// The dashboard reads `?repo=` and `?module=` from the URL via
// `useSearchParams` in client components. The page therefore cannot be
// statically prerendered; it must be server-rendered on demand.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
  <div className="flex min-h-screen bg-surface-base">
    <Sidebar />

    <div className="flex min-w-0 flex-1 flex-col">
      <Suspense fallback={null}>
        <TopBar />
      </Suspense>

      <main className="flex min-w-0 flex-1 justify-center overflow-y-auto xl:pr-8 2xl:pr-12">
        <div className="flex w-full max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-10 xl:px-14 2xl:px-16">
          <Suspense fallback={null}>
            <RepoUrlInput />
          </Suspense>

          <Suspense fallback={null}>
            <UnknownRepoFallback>
              <PanelSlot label="02 · Repository" aria="Loading repository overview">
                <RepoOverview />
              </PanelSlot>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
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
    <ErrorBoundary label={label}>
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
    </ErrorBoundary>
  );
}
