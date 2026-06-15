import { NextResponse } from "next/server";
import { fetchGitHubRepo } from "@/lib/github";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");

  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return NextResponse.json({ error: "invalid_repo" }, { status: 400 });
  }

  const data = await fetchGitHubRepo(repo);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
