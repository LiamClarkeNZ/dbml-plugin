import type { ElkNode } from "elkjs/lib/elk.bundled.js";
import { describe, expect, it } from "vitest";
import sample from "./fixtures/sample-schema.json";
import { absolutePositions, layout } from "./layout";
import type {
  ColumnModel,
  EnumModel,
  GroupModel,
  RelationModel,
  SchemaModel,
  TableModel,
} from "./schema";
import { tableNodeId, toFlow } from "./transform";

describe("layout", () => {
  it("assigns a distinct position to every node", async () => {
    const { nodes, edges } = toFlow(sample as SchemaModel);
    const positioned = await layout(nodes, edges, (sample as SchemaModel).groups);

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
    const positioned = await layout(nodes, edges, (sample as SchemaModel).groups);
    const byId = new Map(positioned.map((n) => [n.id, n]));
    // relation edge is source=posts -> target=users, so posts sits left of users
    expect(byId.get("posts")!.position.x).toBeLessThan(byId.get("users")!.position.x);
  });
});

// --- group-aware layout ---------------------------------------------------

const col = (name: string, type = "int"): ColumnModel => ({
  name,
  type,
  pk: false,
  unique: false,
  notNull: false,
  increment: false,
  sourceOffset: 0,
});

const table = (key: string, columns: ColumnModel[]): TableModel => ({
  key,
  name: key,
  columns,
  indexes: [],
  sourceOffset: 0,
});

const enumModel = (key: string, values: string[]): EnumModel => ({
  key,
  name: key,
  values,
  sourceOffset: 0,
});

const relation = (
  fromTable: string,
  fromColumn: string,
  toTable: string,
  toColumn: string,
): RelationModel => ({
  fromTable,
  fromColumns: [fromColumn],
  toTable,
  toColumns: [toColumn],
  cardinality: "MANY_TO_ONE",
  resolved: true,
  sourceOffset: 0,
});

/**
 * Mirrors the reported bug: a "core" group (users, orders, order_items) and a "catalogue"
 * group (products, wishlists), with relations interleaved between them so a flat ELK graph
 * has every incentive to interleave their members positionally.
 */
function twoGroupSchema(): {
  schema: SchemaModel;
  flow: ReturnType<typeof toFlow>;
} {
  const tables = [
    table("users", [col("id")]),
    table("orders", [col("id"), col("user_id"), col("status", "order_status")]),
    table("order_items", [col("id"), col("order_id"), col("product_id")]),
    table("products", [col("id")]),
    table("wishlists", [col("id"), col("user_id"), col("product_id")]),
    table("audit_logs", [col("id"), col("user_id")]),
  ];
  const enums = [enumModel("order_status", ["pending", "shipped"])];
  const relations = [
    relation("orders", "user_id", "users", "id"), // within core
    relation("order_items", "order_id", "orders", "id"), // within core
    relation("order_items", "product_id", "products", "id"), // core -> catalogue
    relation("wishlists", "user_id", "users", "id"), // catalogue -> core
    relation("wishlists", "product_id", "products", "id"), // within catalogue
    relation("audit_logs", "user_id", "users", "id"), // ungrouped -> core
  ];
  const groups: GroupModel[] = [
    { name: "core", tableKeys: ["users", "orders", "order_items"], sourceOffset: 0 },
    { name: "catalogue", tableKeys: ["products", "wishlists"], sourceOffset: 0 },
  ];
  const schema: SchemaModel = { tables, enums, relations, groups, parseErrorCount: 0 };
  return { schema, flow: toFlow(schema) };
}

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function boundingBox(
  keys: string[],
  positioned: Awaited<ReturnType<typeof layout>>,
): Box {
  const byId = new Map(positioned.map((n) => [n.id, n]));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const key of keys) {
    const n = byId.get(tableNodeId(key));
    if (!n) continue;
    const w = n.width ?? 0;
    const h = n.height ?? 0;
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }
  return { minX, minY, maxX, maxY };
}

function intersects(a: Box, b: Box): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
}

describe("group-aware layout", () => {
  it("keeps two interleaved-relation groups from overlapping", async () => {
    const { schema, flow } = twoGroupSchema();
    const positioned = await layout(flow.nodes, flow.edges, schema.groups);

    const core = boundingBox(["users", "orders", "order_items"], positioned);
    const catalogue = boundingBox(["products", "wishlists"], positioned);

    expect(intersects(core, catalogue)).toBe(false);
  });

  it("still gives ungrouped tables and enums finite, distinct positions", async () => {
    const { schema, flow } = twoGroupSchema();
    const positioned = await layout(flow.nodes, flow.edges, schema.groups);
    const byId = new Map(positioned.map((n) => [n.id, n]));

    const auditLogs = byId.get("audit_logs")!; // ungrouped table
    const orderStatus = byId.get("enum:order_status")!; // enum, never grouped

    for (const n of [auditLogs, orderStatus]) {
      expect(Number.isFinite(n.position.x)).toBe(true);
      expect(Number.isFinite(n.position.y)).toBe(true);
    }
    expect(`${auditLogs.position.x},${auditLogs.position.y}`).not.toBe(
      `${orderStatus.position.x},${orderStatus.position.y}`,
    );
  });

  it("places a table listed in two groups exactly once, without crashing", async () => {
    const { schema, flow } = twoGroupSchema();
    // "products" is genuinely claimed by catalogue already; also list it under core to
    // exercise the "table in two groups" rule (first group claiming it wins).
    const groups: GroupModel[] = [
      schema.groups[0],
      { ...schema.groups[0], name: "core-dup", tableKeys: ["products"] },
      schema.groups[1],
    ];

    const positioned = await layout(flow.nodes, flow.edges, groups);

    const productNodes = positioned.filter((n) => n.id === "products");
    expect(productNodes).toHaveLength(1);
    expect(Number.isFinite(productNodes[0].position.x)).toBe(true);
    expect(Number.isFinite(productNodes[0].position.y)).toBe(true);
  });
});

// --- absolutePositions: pin the relative-to-absolute arithmetic directly, no elkjs call --------

describe("absolutePositions", () => {
  it("leaves a root-level node's position untouched", () => {
    const children: ElkNode[] = [{ id: "ungrouped", x: 500, y: 40, width: 240, height: 80 }];

    const positions = absolutePositions(children, new Set());

    expect(positions.get("ungrouped")).toEqual({ x: 500, y: 40 });
  });

  it("adds a group parent's origin to a member's relative position exactly once", () => {
    const children: ElkNode[] = [
      {
        id: "__group__0",
        x: 100,
        y: 200,
        width: 300,
        height: 150,
        children: [{ id: "member", x: 10, y: 20, width: 240, height: 80 }],
      },
    ];

    const positions = absolutePositions(children, new Set(["__group__0"]));

    // 100 + 10 = 110, 200 + 20 = 220. A doubled origin would give (210, 420); an omitted
    // origin would give (10, 20). Both are different numbers from the one asserted here.
    expect(positions.get("member")).toEqual({ x: 110, y: 220 });
  });

  it("offsets each group's members by that group's own origin, not another group's", () => {
    const children: ElkNode[] = [
      {
        id: "__group__0",
        x: 0,
        y: 0,
        width: 300,
        height: 150,
        children: [{ id: "a", x: 10, y: 20, width: 240, height: 80 }],
      },
      {
        id: "__group__1",
        x: 668,
        y: 12,
        width: 300,
        height: 150,
        children: [{ id: "b", x: 28, y: 48, width: 240, height: 80 }],
      },
    ];

    const positions = absolutePositions(children, new Set(["__group__0", "__group__1"]));

    expect(positions.get("a")).toEqual({ x: 10, y: 20 });
    expect(positions.get("b")).toEqual({ x: 696, y: 60 }); // 668+28, 12+48
  });

  it("offsets a single-member group's member the same way as a multi-member group", () => {
    const children: ElkNode[] = [
      {
        id: "__group__0",
        x: 50,
        y: 75,
        width: 296,
        height: 156,
        children: [{ id: "solo", x: 28, y: 48, width: 240, height: 80 }],
      },
    ];

    const positions = absolutePositions(children, new Set(["__group__0"]));

    expect(positions.get("solo")).toEqual({ x: 78, y: 123 }); // 50+28, 75+48
  });
});
