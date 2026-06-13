# RepoMind project standards

This file defines how agents (Claude, others) should work in this repository.

## Project type

Single-page Next.js 14 dashboard (App Router, TypeScript strict, Tailwind CSS, React Flow). All data is mocked statically under `lib/mock/`. There is no backend, no real GitHub API integration, and no authentication.

## Working directory

- Workspace root: the directory containing this file.
- Do not create files at the repo root unless they are standard project files (`package.json`, `tsconfig.json`, etc.) or are explicitly listed in the plan.
- All component files live under `components/`. All non-React helpers live under `lib/`. The shell, panels, graph nodes/edges, cards, and controls each have their own subfolder.

## Dependency rules

- Use `pnpm` exclusively. The lockfile is `pnpm-lock.yaml`; commit it.
- `pnpm-workspace.yaml` exists in the repo but is **not** a monorepo marker. It is a pnpm 11 side-effect of `pnpm approve-builds --all` (records `allowBuilds.unrs-resolver: true`). It is required for `pnpm build` to succeed under pnpm 11. Do not remove it.
- Do not add a state-management library (Redux, Zustand, Jotai). Selection state lives in URL search params via `lib/state/selection.ts`; component-local state is fine.
- Do not add a graph-layout library (`dagre`, `elkjs`). Hand-laid node positions in mock data keep the bundle small and the demo deterministic.
- Do not add real GitHub API code paths. Mock data is sufficient.
- Lazy-import heavy client-only libs (`reactflow`) with `next/dynamic({ ssr: false })`.

## Styling rules

- The dark theme is defined in `tailwind.config.ts` and `app/globals.css`. Use semantic tokens (`bg-surface-base`, `text-text-muted`, `border-border-subtle`) over raw hex values in components.
- Neon accents (`accent.cyan`, `accent.magenta`, `accent.violet`) are reserved for **active/selected** state, **focus rings**, and **risk indicators**. No more than ~3 elements per screen use a neon accent at once.
- `surface.base` is the only allowed app background. Do not paint large neon surfaces.
- Risk palette: `risk.low` = cyan, `risk.medium` = violet, `risk.high` = magenta, `risk.critical` = rose.

## TypeScript

- Strict mode is on. No `any` unless explicitly justified with a comment.
- Co-locate types with their data when they are private; put cross-cutting types in `lib/types.ts`.
- Use `import type { ... }` for type-only imports.

## Code style

- 2-space indentation, single quotes, trailing commas (Next.js default).
- Components are default exports only when they are a page (`app/**/page.tsx`) or the canonical entry of a small module; otherwise prefer named exports.
- Keep components small. If a panel exceeds ~150 lines, split it into `components/cards/*` or `components/graph/*` helpers.

## Verification (per iteration)

Run the narrowest meaningful check for the slice:

- Scaffolding or config change → `pnpm build` and a `pnpm dev` smoke check.
- UI change → `pnpm build` plus a manual visual check of the affected panel.
- Type-only change → `pnpm tsc --noEmit` (the build already covers this).

Do not write or run broad automated test suites. The downstream Reviewer role handles detailed validation.

## Commit conventions

- Use Conventional Commits: `chore:`, `feat:`, `fix:`, `refactor:`, `style:`, `docs:`.
- One logical change per commit. Update `goal-tracker.md` in the same commit as the work it records.

## Out of scope (do not implement)

Authentication, billing, real GitHub API integration, backend persistence, mobile-specific layouts (<1024px is best-effort), automated test suites, i18n, full WCAG 2.2 AA conformance, real LLM integrations.
