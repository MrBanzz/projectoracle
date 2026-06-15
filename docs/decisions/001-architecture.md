# ADR-001: ProjectOracle Architecture Decisions

## Status
Accepted

## Context
ProjectOracle is a repository intelligence dashboard that visualizes
architecture, dependencies, impact analysis, and technical debt for
software repositories.

## Decisions

### 1. Next.js 14 App Router
Chosen for server-side rendering on demand (`force-dynamic`),
built-in API routes (`/api/github`), and Suspense-based loading
boundaries per panel. Static export was ruled out because the
dashboard reads URL params (`?repo=`, `?module=`) at request time.

### 2. React Flow for Visualization
Chosen for its built-in pan/zoom, node/edge data model, and
TypeScript support. Loaded via dynamic imports to keep the initial
JS bundle small and maintain Lighthouse 100/100 performance score.

### 3. Decoupled Mock Data Layer
`lib/mock/*` is intentionally decoupled from UI components.
Components call `getRepo()`, `getDebt()`, `getImpact()` — never
import mock data directly. This lets the mock layer be swapped for
a real API without touching any component.

### 4. MCP Server as Separate Package
`mcp-server/` is a standalone pnpm workspace package with its own
`tsconfig.json` and build output. This keeps the Next.js app bundle
clean and lets AI agents consume repository intelligence tools
independently of the web UI.

### 5. URL as Single Source of Truth
`lib/state/selection.ts` syncs `?repo=` and `?module=` via the
Next.js App Router. No global state (Redux, Zustand, Context) is
used — the URL is the state, making every view shareable and the
back button work correctly.

### 6. GitHub API Integration
`lib/github.ts` + `app/api/github/route.ts` add real GitHub data
fetching without modifying the mock layer. The `/api/github` route
validates input, caches responses for 5 minutes, and returns null
gracefully on rate limits or unknown repos.

## Trade-offs
- Mock data means the demo works offline and never hits rate limits
- Real GitHub API is available but not wired into UI panels yet
- MCP server adds surface area but enables AI agent workflows
