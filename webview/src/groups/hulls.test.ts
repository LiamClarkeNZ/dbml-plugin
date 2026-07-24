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
    expect(hull.y).toBe(-10);
    expect(hull.width).toBe(200 + 100 + 20); // spread + node width + 2*pad
    expect(hull.height).toBe(100 + 50 + 20);
  });

  it("skips groups whose members are absent", () => {
    const groups: GroupModel[] = [
      { name: "ghost", tableKeys: ["x"], sourceOffset: 0 },
    ];
    expect(computeHulls(groups, [node("a", 0, 0)])).toHaveLength(0);
  });
});
