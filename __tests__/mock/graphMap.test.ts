import {
  archNodeIdForDepNode,
  findDepNode,
} from "@/lib/mock/graphMap";
import type { ArchGraph, DepGraph, DepNode } from "@/lib/types";

describe("archNodeIdForDepNode", () => {
  const mockArchGraph: ArchGraph = {
    nodes: [
      // Intentionally unsorted: the function must sort by length
      // descending internally so the longest prefix wins.
      { id: "apps", label: "apps", layer: "apps", position: { x: 0, y: 0 } },
      {
        id: "services/payments",
        label: "services/payments",
        layer: "services",
        position: { x: 0, y: 0 },
      },
      {
        id: "apps/web",
        label: "apps/web",
        layer: "apps",
        position: { x: 0, y: 0 },
      },
    ],
    edges: [],
  };

  test("maps a deeper dep id to the apps/web arch node", () => {
    expect(archNodeIdForDepNode("apps/web/pages/checkout", mockArchGraph)).toBe(
      "apps/web",
    );
  });

  test("maps a deeper dep id to the services/payments arch node", () => {
    expect(
      archNodeIdForDepNode("services/payments/processor", mockArchGraph),
    ).toBe("services/payments");
  });

  test("returns the matching arch node id when the dep id is an exact match", () => {
    expect(archNodeIdForDepNode("apps/web", mockArchGraph)).toBe("apps/web");
  });

  test("returns null when no arch node is a prefix of the dep id", () => {
    expect(archNodeIdForDepNode("unknown/module", mockArchGraph)).toBeNull();
  });
});

describe("findDepNode", () => {
  const node: DepNode = {
    id: "apps/web",
    label: "Web",
    layer: "apps",
    files: 5,
    inCount: 0,
    outCount: 0,
    position: { x: 0, y: 0 },
  };
  const mockDepGraph: DepGraph = {
    nodes: [node],
    edges: [],
  };

  test("returns the matching node when the id exists", () => {
    expect(findDepNode(mockDepGraph, "apps/web")).toBe(node);
  });

  test("returns undefined when the id is not in the graph", () => {
    expect(findDepNode(mockDepGraph, "does/not/exist")).toBeUndefined();
  });
});
