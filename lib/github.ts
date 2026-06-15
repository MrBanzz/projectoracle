import type { RepoData } from "@/lib/types";

export async function fetchGitHubRepo(
  repoId: string
): Promise<RepoData | null> {
  const [owner, repo] = repoId.split("/");
  if (!owner || !repo) return null;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const [repoRes, langRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }),
    ]);
    if (!repoRes.ok) return null;

    const repoJson = await repoRes.json();
    const langJson: Record<string, number> = langRes.ok ? await langRes.json() : {};

    // Convert byte counts to percentages
    const total = Object.values(langJson).reduce((a, b) => a + b, 0);
    const entries = Object.entries(langJson)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const languages =
      total === 0
        ? []
        : (() => {
            const top = entries.map(([name, bytes]) => ({
              name,
              pct: Math.round((bytes / total) * 100),
            }));
            const topSum = top.reduce((a, l) => a + l.pct, 0);
            const remainder = 100 - topSum;
            if (remainder > 0 && Object.keys(langJson).length > 5) {
              top.push({ name: "Other", pct: remainder });
            }
            return top;
          })();

    return {
      id: repoId,
      fullName: repoJson.full_name ?? repoId,
      description: repoJson.description ?? "",
      languages,
      totals: {
        files: repoJson.size ?? 0,
        modules: 0,
      },
      health: {
        score: 0,
        complexity: 0,
        debtIndex: 0,
        coverage: 0,
        deltas: { score: 0, complexity: 0, debtIndex: 0, coverage: 0 },
      },
      analyzedAt: repoJson.updated_at ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
