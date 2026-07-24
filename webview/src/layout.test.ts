import { describe, expect, it } from "vitest";
import sample from "./fixtures/sample-schema.json";
import { layout } from "./layout";
import type { SchemaModel } from "./schema";
import { toFlow } from "./transform";

describe("layout", () => {
  it("assigns a distinct position to every node", async () => {
    const { nodes, edges } = toFlow(sample as SchemaModel);
    const positioned = await layout(nodes, edges);

    expect(positioned).toHaveLength(nodes.length);
    for (const n of positioned) {
      expect(Number.isFinite(n.position.x)).toBe(true);
      expect(Number.isFinite(n.position.y)).toBe(true);
    }
    const coords = new Set(positioned.map((n) => `${n.position.x},${n.position.y}`));
    expect(coords.size).toBe(positioned.length); // no two nodes stacked
  });

  it("orders edge sources left of their targets (RIGHT direction)", async () => {
    const { nodes, edges } = toFlow(sample as SchemaModel);
    const positioned = await layout(nodes, edges);
    const byId = new Map(positioned.map((n) => [n.id, n]));
    // relation edge is source=posts -> target=users, so posts sits left of users
    expect(byId.get("posts")!.position.x).toBeLessThan(byId.get("users")!.position.x);
  });
});
