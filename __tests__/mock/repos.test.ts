import {
  getRepo,
  REPOS,
  REPO_IDS,
  DEFAULT_REPO_ID,
} from "@/lib/mock/repos";

describe("repos catalog", () => {
  test("DEFAULT_REPO_ID is the acme seeded repo", () => {
    expect(DEFAULT_REPO_ID).toBe("acme/payments-platform");
  });

  test("REPO_IDS contains both seeded repos", () => {
    expect(REPO_IDS).toContain("acme/payments-platform");
    expect(REPO_IDS).toContain("stellar/orbit-ui");
  });
});

describe("getRepo", () => {
  test("returns undefined for null", () => {
    expect(getRepo(null)).toBeUndefined();
  });

  test("returns undefined for an unknown id", () => {
    expect(getRepo("unknown/repo")).toBeUndefined();
  });

  test("returns the full acme entry", () => {
    const repo = getRepo("acme/payments-platform");
    expect(repo).toBeDefined();
    expect(repo).toBe(REPOS["acme/payments-platform"]);
    expect(repo?.id).toBeDefined();
    expect(repo?.fullName).toBeDefined();
    expect(repo?.description).toBeDefined();
    expect(Array.isArray(repo?.languages)).toBe(true);
    expect(repo?.totals).toBeDefined();
    expect(repo?.health).toBeDefined();
    expect(repo?.analyzedAt).toBeDefined();
    expect(repo?.health.score).toBe(78);
    expect(repo?.totals.files).toBe(4182);
    expect(repo?.totals.modules).toBe(47);
  });

  test("returns the full stellar entry", () => {
    const repo = getRepo("stellar/orbit-ui");
    expect(repo).toBeDefined();
    expect(repo?.health.score).toBe(84);
    expect(repo?.totals.files).toBe(1824);
    expect(repo?.totals.modules).toBe(28);
  });
});
