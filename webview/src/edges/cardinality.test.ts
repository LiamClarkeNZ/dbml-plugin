import { describe, expect, it } from "vitest";
import type { FlowEdge } from "../transform";
import { applyEdgeStyling, edgeMarkers } from "./cardinality";

describe("edgeMarkers", () => {
  it("puts the crow's-foot on the many end", () => {
    expect(edgeMarkers("MANY_TO_ONE")).toEqual({
      markerStart: "url(#dbml-many)",
      markerEnd: "url(#dbml-one)",
    });
    expect(edgeMarkers("ONE_TO_MANY")).toEqual({
      markerStart: "url(#dbml-one)",
      markerEnd: "url(#dbml-many)",
    });
  });
});

describe("applyEdgeStyling", () => {
  it("adds markers to relation edges", () => {
    const edge: FlowEdge = {
      id: "rel:a.x->b.y",
      source: "a",
      target: "b",
      sourceHandle: "x",
      targetHandle: "y",
      data: { cardinality: "MANY_TO_ONE", kind: "relation" },
    };
    const styled = applyEdgeStyling(edge);
    expect(styled.markerStart).toBe("url(#dbml-many)");
    expect(styled.markerEnd).toBe("url(#dbml-one)");
  });

  it("dashes enum edges without markers", () => {
    const edge: FlowEdge = {
      id: "enumref:a.x->enum:e",
      source: "a",
      target: "enum:e",
      sourceHandle: "x",
      data: { cardinality: "MANY_TO_ONE", kind: "enum" },
    };
    const styled = applyEdgeStyling(edge);
    expect(styled.markerStart).toBeUndefined();
    expect(styled.style?.strokeDasharray).toBe("4 3");
  });
});
