#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const repositories = {
  "acme/payments-platform": {
    overview: {
      name: "acme/payments-platform",
      description: "Distributed payments platform for global merchants.",
      healthScore: 78,
      complexity: 32,
      techDebtIndex: 41,
      testCoverage: 73,
      primaryLanguage: "TypeScript",
    },
    architecture: {
      layers: ["apps", "services", "packages", "infrastructure"],
      nodes: [
        "apps/web",
        "apps/api",
        "services/auth",
        "services/payments",
        "services/ledger",
        "packages/ui",
        "packages/db",
        "infrastructure",
      ],
    },
    dependencies: {
      modules: 20,
      edges: 31,
      examples: [
        "apps/web/pages/dashboard -> services/payments/processor",
        "apps/api/routes/charges -> services/ledger/writer",
        "services/auth/sessions -> packages/db/postgres",
      ],
    },
    impact: {
      moduleId: "apps/web/pages/dashboard",
      risk: "MEDIUM",
      blastRadiusFiles: 0,
      transitivelyAffectedFiles: 0,
      recommendations: [
        "Add targeted tests around affected paths.",
        "Use a staged rollout or feature flag when risk is elevated.",
        "Review directly connected modules before merging.",
      ],
    },
    debt: [
      {
        severity: "HIGH",
        category: "Duplication",
        title: "Refunds flow has duplicated 3DS challenge logic",
      },
      {
        severity: "HIGH",
        category: "Complexity",
        title: "Ledger writer has cyclomatic complexity of 47",
      },
      {
        severity: "MEDIUM",
        category: "Outdated Deps",
        title: "Stripe SDK is pinned to a 14-month-old major version",
      },
    ],
  },
  "stellar/orbit-ui": {
    overview: {
      name: "stellar/orbit-ui",
      description: "Mock design-system repository for UI architecture analysis.",
      healthScore: 84,
      complexity: 24,
      techDebtIndex: 28,
      testCoverage: 81,
      primaryLanguage: "TypeScript",
    },
  },
};

const server = new McpServer({
  name: "projectoracle-mcp-server",
  version: "0.1.0",
});

function json(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

server.tool(
  "list_demo_repositories",
  "List demo repositories available in ProjectOracle.",
  {},
  async () => json({ repositories: Object.keys(repositories) }),
);

server.tool(
  "get_repository_overview",
  "Get repository overview, health score, complexity, debt index, and coverage.",
  {
    repoId: z.string(),
  },
  async ({ repoId }) => {
    const repo = repositories[repoId as keyof typeof repositories];

    if (!repo) {
      return json({
        error: "Repository not found",
        availableRepositories: Object.keys(repositories),
      });
    }

    return json(repo.overview);
  },
);

server.tool(
  "get_architecture_map",
  "Get architecture layers and major repository components.",
  {
    repoId: z.string(),
  },
  async ({ repoId }) => {
    const repo = repositories[repoId as keyof typeof repositories];

    if (!repo || !("architecture" in repo)) {
      return json({ error: "Architecture map not available for this repository" });
    }

    return json(repo.architecture);
  },
);

server.tool(
  "get_dependency_graph",
  "Get dependency graph summary for a repository.",
  {
    repoId: z.string(),
  },
  async ({ repoId }) => {
    const repo = repositories[repoId as keyof typeof repositories];

    if (!repo || !("dependencies" in repo)) {
      return json({ error: "Dependency graph not available for this repository" });
    }

    return json(repo.dependencies);
  },
);

server.tool(
  "get_impact_analysis",
  "Get module impact analysis and AI engineering recommendations.",
  {
    repoId: z.string(),
    moduleId: z.string().optional(),
  },
  async ({ repoId, moduleId }) => {
    const repo = repositories[repoId as keyof typeof repositories];

    if (!repo || !("impact" in repo)) {
      return json({ error: "Impact analysis not available for this repository" });
    }

    return json({
      ...repo.impact,
      requestedModuleId: moduleId ?? repo.impact.moduleId,
    });
  },
);

server.tool(
  "get_technical_debt",
  "Get prioritized technical debt findings.",
  {
    repoId: z.string(),
  },
  async ({ repoId }) => {
    const repo = repositories[repoId as keyof typeof repositories];

    if (!repo || !("debt" in repo)) {
      return json({ error: "Technical debt data not available for this repository" });
    }

    return json({
      repoId,
      items: repo.debt,
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);