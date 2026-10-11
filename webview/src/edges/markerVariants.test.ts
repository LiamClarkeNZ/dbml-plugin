import { describe, expect, it } from "vitest";
import type { FlowEdge } from "../transform";
import { customTokens, DEFAULT_TOKEN, markerId } from "./markerVariants";

const edge = (id: string, colour?: string): FlowEdge => ({
  id,
  source: "a",
  target: "b",
  data: { cardinality: "MANY_TO_ONE", kind: "relation", colour },
});

describe("markerId", () => {
  it("names role variants", () => {
    expect(markerId("one", DEFAULT_TOKEN)).toBe("dbml-one--default");
    expect(markerId("many", { kind: "role", role: "highlight" })).toBe("dbml-many--highlight");
  });

  it("derives custom variants from the hex without the hash, so the id is valid", () => {
    expect(markerId("many", { kind: "custom", hex: "#b19888" })).toBe("dbml-many--c-b19888");
    expect(markerId("one", { kind: "custom", hex: "#b19888" })).not.toContain("#");
  });

  it("never returns a url() wrapper - React Flow adds that itself", () => {
    expect(markerId("one", DEFAULT_TOKEN)).toMatch(/^dbml-(one|many)--[a-z0-9-]+$/);
  });
});

describe("customTokens", () => {
  it("collects each distinct colour once", () => {
    const tokens = customTokens([
      edge("e1", "#b19888"),
      edge("e2", "#b19888"),
      edge("e3", "#7c9772"),
      edge("e4"),
    ]);
    expect(tokens).toEqual([
      { kind: "custom", hex: "#b19888" },
      { kind: "custom", hex: "#7c9772" },
    ]);
  });

  it("returns nothing when no edge is coloured", () => {
    expect(customTokens([edge("e1")])).toEqual([]);
  });
});
