import { describe, expect, it } from "vitest";
import type { GroupModel } from "../schema";
import type { FlowNode } from "../transform";
import { computeHulls } from "./hulls";

const node = (id: string, x: number, y: number): FlowNode =>
  ({
    id,
    type: "table",
    position: { x, y },
    width: 100,
    height: 50,
    data: { table: { key: id, name: id, columns: [], indexes: [], sourceOffset: 0 } },
  }) as FlowNode;

describe("computeHulls", () => {
  it("bounds all member nodes with padding", () => {
    const groups: GroupModel[] = [
      { name: "core", tableKeys: ["a", "b"], sourceOffset: 0 },
    ];
    const nodes = [node("a", 0, 0), node("b", 200, 100), node("c", 999, 999)];
    const [hull] = computeHulls(groups, nodes, 10);
    expect(hull.name).toBe("core");
    expect(hull.x).toBe(-10); // min x (0) - pad
    expect(hull.y).toBe(-48); // min y (0) - padTop (default 48)
    expect(hull.width).toBe(200 + 100 + 20); // spread + node width + 2*pad
    expect(hull.height).toBe(100 + 50 + 48 + 10); // height + padTop + pad
  });

  it("skips groups whose members are absent", () => {
    const groups: GroupModel[] = [
      { name: "ghost", tableKeys: ["x"], sourceOffset: 0 },
    ];
    expect(computeHulls(groups, [node("a", 0, 0)])).toHaveLength(0);
  });

  it("reserves extra room at the top for the label chip", () => {
    const nodes = [
      { id: "users", type: "table", position: { x: 100, y: 200 }, width: 240, height: 80, data: {} },
    ] as unknown as FlowNode[];
    const [hull] = computeHulls([{ name: "core", tableKeys: ["users"], sourceOffset: 0 }], nodes);
    expect(hull.y).toBe(200 - 48);
    expect(hull.x).toBe(100 - 28);
    expect(hull.height).toBe(80 + 48 + 28);
    expect(hull.width).toBe(240 + 56);
  });

  it("paints larger hulls first so a nested group is not washed over by its parent", () => {
    const nodes = [node("a", 0, 0), node("b", 400, 400)];
    const groups: GroupModel[] = [
      { name: "catalogue", tableKeys: ["b"], sourceOffset: 0 },
      { name: "core", tableKeys: ["a", "b"], sourceOffset: 0 },
    ];
    // Declaration order puts the small group first; area order must override it.
    expect(computeHulls(groups, nodes).map((h) => h.name)).toEqual(["core", "catalogue"]);
  });

  it("carries the group colour through", () => {
    const nodes = [
      { id: "users", type: "table", position: { x: 0, y: 0 }, width: 240, height: 80, data: {} },
    ] as unknown as FlowNode[];
    const groups = [{ name: "core", tableKeys: ["users"], sourceOffset: 0, color: "#7c9772" }];
    expect(computeHulls(groups, nodes)[0].colour).toBe("#7c9772");
  });
});
