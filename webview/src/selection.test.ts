import { describe, expect, it } from "vitest";
import type { SchemaModel } from "./schema";
import { highlightFor } from "./selection";

const table = (key: string, columns: string[]) => ({
  key,
  name: key,
  columns: columns.map((name) => ({
    name,
    type: "int",
    pk: false,
    unique: false,
    notNull: false,
    increment: false,
    sourceOffset: 0,
  })),
  indexes: [],
  sourceOffset: 0,
});

const relation = (fromTable: string, fromColumn: string, toTable: string, toColumn: string, resolved = true) => ({
  fromTable,
  fromColumns: [fromColumn],
  toTable,
  toColumns: [toColumn],
  cardinality: "MANY_TO_ONE" as const,
  resolved,
  sourceOffset: 0,
});

const schema: SchemaModel = {
  tables: [table("products", ["id", "name"]), table("order_items", ["product_id"]), table("wishlists", ["product_id"])],
  enums: [],
  relations: [
    relation("order_items", "product_id", "products", "id"),
    relation("wishlists", "product_id", "products", "id"),
    relation("wishlists", "product_id", "products", "id", false),
  ],
  groups: [],
  parseErrorCount: 0,
};

describe("highlightFor", () => {
  it("fans out from a column to every relation touching it", () => {
    const hl = highlightFor(schema, { kind: "column", table: "products", column: "id" });
    expect([...hl.edges].sort()).toEqual([
      "rel:order_items.product_id->products.id",
      "rel:wishlists.product_id->products.id",
    ]);
    expect([...hl.columns].sort()).toEqual([
      "order_items.product_id",
      "products.id",
      "wishlists.product_id",
    ]);
  });

  it("highlights both endpoints of a clicked edge", () => {
    const hl = highlightFor(schema, { kind: "edge", id: "rel:order_items.product_id->products.id" });
    expect([...hl.edges]).toEqual(["rel:order_items.product_id->products.id"]);
    expect([...hl.columns].sort()).toEqual(["order_items.product_id", "products.id"]);
  });

  it("fans out from a column that is a from endpoint", () => {
    const hl = highlightFor(schema, { kind: "column", table: "order_items", column: "product_id" });
    expect([...hl.edges]).toEqual(["rel:order_items.product_id->products.id"]);
    expect([...hl.columns].sort()).toEqual(["order_items.product_id", "products.id"]);
  });

  it("ignores unresolved relations, which draw no edge", () => {
    const only = { ...schema, relations: [relation("a", "x", "b", "y", false)] };
    const hl = highlightFor(only, { kind: "column", table: "a", column: "x" });
    expect(hl.edges.size).toBe(0);
    expect(hl.columns.size).toBe(0);
  });

  it("returns nothing for a column in no relation", () => {
    const hl = highlightFor(schema, { kind: "column", table: "products", column: "name" });
    expect(hl.edges.size).toBe(0);
  });
});
