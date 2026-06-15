import { formatRelativeTime, formatCount } from "@/lib/format";

describe("formatRelativeTime", () => {
  const NOW = new Date("2026-06-16T10:00:00Z");

  test('returns "just now" for diffs under 1 minute', () => {
    expect(
      formatRelativeTime("2026-06-16T10:00:00Z", new Date("2026-06-16T10:00:30Z")),
    ).toBe("just now");
  });

  test("returns minutes for diffs under an hour", () => {
    expect(
      formatRelativeTime("2026-06-16T09:30:00Z", NOW),
    ).toBe("30m ago");
  });

  test("returns hours for diffs under a day", () => {
    expect(
      formatRelativeTime("2026-06-16T05:00:00Z", NOW),
    ).toBe("5h ago");
  });

  test("returns days for diffs under a month", () => {
    expect(
      formatRelativeTime("2026-06-13T10:00:00Z", NOW),
    ).toBe("3d ago");
  });

  test("returns months for diffs under a year", () => {
    expect(
      formatRelativeTime("2026-04-16T10:00:00Z", NOW),
    ).toBe("2mo ago");
  });

  test("returns years for diffs >= 1 year", () => {
    expect(
      formatRelativeTime("2024-06-16T10:00:00Z", NOW),
    ).toBe("2y ago");
  });

  test('returns "—" for an unparseable input', () => {
    expect(formatRelativeTime("not-a-date", new Date())).toBe("—");
  });
});

describe("formatCount", () => {
  test("formats 0 without separators", () => {
    expect(formatCount(0)).toBe("0");
  });

  test("formats 4-digit integers with a thousands separator", () => {
    expect(formatCount(4182)).toBe("4,182");
  });

  test("formats 7-digit integers with grouped separators", () => {
    expect(formatCount(1000000)).toBe("1,000,000");
  });

  test('returns "—" for Infinity', () => {
    expect(formatCount(Infinity)).toBe("—");
  });

  test('returns "—" for NaN', () => {
    expect(formatCount(NaN)).toBe("—");
  });
});
