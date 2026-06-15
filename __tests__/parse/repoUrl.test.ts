import {
  parseRepoUrl,
  INVALID_REPO_MESSAGE,
} from "@/lib/parse/repoUrl";

describe("parseRepoUrl — valid inputs", () => {
  test("parses a canonical https URL", () => {
    expect(
      parseRepoUrl("https://github.com/acme/payments-platform"),
    ).toEqual({
      ok: true,
      owner: "acme",
      repo: "payments-platform",
      id: "acme/payments-platform",
    });
  });

  test("parses a different owner/repo pair", () => {
    expect(parseRepoUrl("https://github.com/stellar/orbit-ui")).toEqual({
      ok: true,
      owner: "stellar",
      repo: "orbit-ui",
      id: "stellar/orbit-ui",
    });
  });

  test("accepts the http scheme", () => {
    expect(
      parseRepoUrl("http://github.com/acme/payments-platform"),
    ).toEqual({
      ok: true,
      owner: "acme",
      repo: "payments-platform",
      id: "acme/payments-platform",
    });
  });

  test("tolerates a trailing slash", () => {
    expect(
      parseRepoUrl("https://github.com/acme/payments-platform/"),
    ).toEqual({
      ok: true,
      owner: "acme",
      repo: "payments-platform",
      id: "acme/payments-platform",
    });
  });

  test("strips a trailing .git suffix", () => {
    expect(
      parseRepoUrl("https://github.com/acme/payments-platform.git"),
    ).toEqual({
      ok: true,
      owner: "acme",
      repo: "payments-platform",
      id: "acme/payments-platform",
    });
  });

  test("allows dots and dashes in owner and repo segments", () => {
    expect(parseRepoUrl("https://github.com/my.org/my-repo")).toEqual({
      ok: true,
      owner: "my.org",
      repo: "my-repo",
      id: "my.org/my-repo",
    });
  });
});

describe("parseRepoUrl — invalid inputs", () => {
  test.each([
    ["empty string", ""],
    ["whitespace only", "   "],
    ["not a url", "not-a-url"],
    ["non-github host", "https://gitlab.com/acme/repo"],
    ["missing repo segment", "https://github.com/acme"],
    ["too many path segments", "https://github.com/acme/repo/extra/segment"],
    ["javascript: pseudo-protocol", "javascript:alert(1)"],
  ])("rejects %s", (_label, input) => {
    expect(parseRepoUrl(input)).toEqual({
      ok: false,
      error: INVALID_REPO_MESSAGE,
    });
  });
});
