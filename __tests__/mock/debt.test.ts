import { getDebt, DEBT } from "@/lib/mock/debt";
import type { DebtCategory, DebtSeverity } from "@/lib/types";

const VALID_SEVERITIES: ReadonlyArray<DebtSeverity> = [
  "LOW",
  "MEDIUM",
  "HIGH",
];
const VALID_CATEGORIES: ReadonlyArray<DebtCategory> = [
  "Complexity",
  "Duplication",
  "Coverage",
  "Outdated Deps",
  "Security",
];

describe("DEBT catalog", () => {
  test("acme repo has exactly 5 debt items", () => {
    expect(DEBT["acme/payments-platform"]).toHaveLength(5);
  });

  test("stellar repo has exactly 5 debt items", () => {
    expect(DEBT["stellar/orbit-ui"]).toHaveLength(5);
  });

  describe.each<[string, ReadonlyArray<unknown>]>([
    ["acme/payments-platform", DEBT["acme/payments-platform"]],
    ["stellar/orbit-ui", DEBT["stellar/orbit-ui"]],
  ])("%s debt items", (_label, items) => {
    test("every item has a non-empty id, title, and description", () => {
      for (const item of items as ReadonlyArray<{
        id: string;
        title: string;
        description: string;
      }>) {
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.title).toBe("string");
        expect(item.title.length).toBeGreaterThan(0);
        expect(typeof item.description).toBe("string");
        expect(item.description.length).toBeGreaterThan(0);
      }
    });

    test("every severity is one of LOW, MEDIUM, or HIGH", () => {
      for (const item of items as ReadonlyArray<{ severity: DebtSeverity }>) {
        expect(VALID_SEVERITIES).toContain(item.severity);
      }
    });

    test("every category is one of the five AC-9 buckets", () => {
      for (const item of items as ReadonlyArray<{ category: DebtCategory }>) {
        expect(VALID_CATEGORIES).toContain(item.category);
      }
    });
  });
});

describe("getDebt", () => {
  test("falls back to the default repo's debt when repoId is null", () => {
    const items = getDebt(null);
    expect(items).toHaveLength(5);
    expect(items).toBe(DEBT["acme/payments-platform"]);
  });

  test("falls back to the default repo's debt when repoId is unknown", () => {
    const items = getDebt("unknown/repo");
    expect(items).toHaveLength(5);
    expect(items).toBe(DEBT["acme/payments-platform"]);
  });

  test("returns the acme debt list for the acme repo", () => {
    expect(getDebt("acme/payments-platform")).toHaveLength(5);
    expect(getDebt("acme/payments-platform")).toBe(DEBT["acme/payments-platform"]);
  });

  test("returns the stellar debt list for the stellar repo", () => {
    expect(getDebt("stellar/orbit-ui")).toHaveLength(5);
    expect(getDebt("stellar/orbit-ui")).toBe(DEBT["stellar/orbit-ui"]);
  });
});
