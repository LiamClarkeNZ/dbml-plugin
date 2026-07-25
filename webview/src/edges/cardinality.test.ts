import { describe, expect, it } from "vitest";
import type { FlowEdge } from "../transform";
import { applyEdgeStyling, edgeMarkers, MARKER_IDS } from "./cardinality";

describe("edgeMarkers", () => {
  it("puts the crow's-foot on the many end", () => {
    expect(edgeMarkers("MANY_TO_ONE")).toEqual({
      markerStart: MARKER_IDS.many,
      markerEnd: MARKER_IDS.one,
    });
    expect(edgeMarkers("ONE_TO_MANY")).toEqual({
      markerStart: MARKER_IDS.one,
      markerEnd: MARKER_IDS.many,
    });
  });

  // React Flow renders string markers as url('#' + value). A pre-wrapped url(#id) therefore becomes
  // url('#url(#id)') and silently references nothing, which is how the markers shipped invisible.
  it("emits bare element ids, never a url() wrapper", () => {
    const cardinalities = ["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE", "MANY_TO_MANY"] as const;
    for (const cardinality of cardinalities) {
      const { markerStart, markerEnd } = edgeMarkers(cardinality);
      for (const id of [markerStart, markerEnd]) {
        expect(id).toMatch(/^dbml-(one|many)$/);
      }
    }
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
    expect(styled.markerStart).toBe(MARKER_IDS.many);
    expect(styled.markerEnd).toBe(MARKER_IDS.one);
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
