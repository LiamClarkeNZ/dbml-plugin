import { describe, expect, it } from "vitest";
import type { FlowEdge } from "../transform";
import { applyEdgeStyling, edgeMarkers } from "./cardinality";
import { DEFAULT_TOKEN, markerId } from "./markerVariants";

describe("edgeMarkers", () => {
  it("puts the crow's-foot on the many end", () => {
    expect(edgeMarkers("MANY_TO_ONE")).toEqual({
      markerStart: markerId("many", DEFAULT_TOKEN),
      markerEnd: markerId("one", DEFAULT_TOKEN),
    });
    expect(edgeMarkers("ONE_TO_MANY")).toEqual({
      markerStart: markerId("one", DEFAULT_TOKEN),
      markerEnd: markerId("many", DEFAULT_TOKEN),
    });
  });

  // React Flow renders string markers as url('#' + value). A pre-wrapped url(#id) therefore becomes
  // url('#url(#id)') and silently references nothing, which is how the markers shipped invisible.
  it("emits bare element ids, never a url() wrapper", () => {
    const cardinalities = ["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE", "MANY_TO_MANY"] as const;
    for (const cardinality of cardinalities) {
      const { markerStart, markerEnd } = edgeMarkers(cardinality);
      for (const id of [markerStart, markerEnd]) {
        expect(id).toMatch(/^dbml-(one|many)--default$/);
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
    expect(styled.markerStart).toBe(markerId("many", DEFAULT_TOKEN));
    expect(styled.markerEnd).toBe(markerId("one", DEFAULT_TOKEN));
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

  it("uses the author colour for both the stroke and the markers", () => {
    const edge: FlowEdge = {
      id: "rel:a.x->b.y",
      source: "a",
      target: "b",
      sourceHandle: "x",
      targetHandle: "y",
      data: { cardinality: "MANY_TO_ONE", kind: "relation", colour: "#61afef" },
    };
    const styled = applyEdgeStyling(edge);
    expect(styled.markerStart).toBe("dbml-many--c-61afef");
    expect(styled.markerEnd).toBe("dbml-one--c-61afef");
    expect(styled.style?.stroke).toBe("#61afef");
  });
});
