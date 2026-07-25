import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { STUB_LENGTH, stubPath } from "./StubEdge";

const params = {
  sourceX: 100,
  sourceY: 50,
  targetX: 300,
  targetY: 200,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

describe("stubPath", () => {
  it("starts with a horizontal lead-in of the stub length", () => {
    expect(stubPath(params)).toMatch(/^M100,50 L114,50 C/);
  });

  it("ends with a horizontal lead-out to the target", () => {
    expect(stubPath(params)).toMatch(/L300,200$/);
  });

  it("curves between the inset endpoints, not the raw ones", () => {
    const d = stubPath(params);
    expect(d).toContain(`L${100 + STUB_LENGTH},50`);
    // Pins where the curve itself terminates (300 - STUB_LENGTH = 286), not just where the
    // path string ends up after the lead-out is appended - a dropped or misapplied target
    // inset would still leave the string ending in "L300,200" and slip past a weaker check.
    expect(d).toMatch(/C[\d.,\s]+ 286,200 L300,200$/);
  });
});
