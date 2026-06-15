import { cn } from "@/lib/utils";

describe("cn", () => {
  test("joins two truthy strings with a space", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  test("drops false branches", () => {
    expect(cn("a", false && "b")).toBe("a");
  });

  test("drops undefined inputs", () => {
    expect(cn("a", undefined)).toBe("a");
  });

  test("returns an empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  test("joins multiple truthy strings with a space", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });
});
