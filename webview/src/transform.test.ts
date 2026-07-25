import { describe, expect, it } from "vitest";
import sample from "./fixtures/sample-schema.json";
import unresolved from "./fixtures/unresolved-relation-schema.json";
import type { SchemaModel } from "./schema";
import { toFlow } from "./transform";

describe("toFlow", () => {
  it("creates a node per table and per enum", () => {
    const { nodes } = toFlow(sample as SchemaModel);
    const tableNodes = nodes.filter((n) => n.type === "table");
    const enumNodes = nodes.filter((n) => n.type === "enum");
    expect(tableNodes.map((n) => n.id)).toEqual(["users", "posts", "comments"]);
    expect(enumNodes.map((n) => n.id)).toEqual(["enum:job_status"]);
  });

  it("maps relations to edges anchored on column handles", () => {
    const { edges } = toFlow(sample as SchemaModel);
    const rel = edges.find((e) => e.id.startsWith("rel:"));
    expect(rel).toBeDefined();
    expect(rel!.source).toBe("posts");
    expect(rel!.sourceHandle).toBe("user_id");
    expect(rel!.target).toBe("users");
    expect(rel!.targetHandle).toBe("id");
    expect(rel!.data!.cardinality).toBe("MANY_TO_ONE");
  });

  it("uses the stub edge type for relation edges", () => {
    const { edges } = toFlow(sample as SchemaModel);
    const rel = edges.find((e) => e.id.startsWith("rel:"));
    expect(rel!.type).toBe("stub");
  });

  it("carries a coloured relation's author colour as edge data", () => {
    const { edges } = toFlow(sample as SchemaModel);
    const rel = edges.find((e) => e.id.startsWith("rel:"));
    expect(rel!.data!.colour).toBe("#5b7fbd");
  });

  it("links enum-typed columns to their enum node", () => {
    const { edges } = toFlow(sample as SchemaModel);
    const enumEdge = edges.find((e) => e.data!.kind === "enum");
    expect(enumEdge).toBeDefined();
    expect(enumEdge!.source).toBe("users");
    expect(enumEdge!.sourceHandle).toBe("status");
    expect(enumEdge!.target).toBe("enum:job_status");
  });

  it("uses the stub edge type for enum-reference edges too", () => {
    const { edges } = toFlow(sample as SchemaModel);
    const enumEdge = edges.find((e) => e.data!.kind === "enum");
    expect(enumEdge!.type).toBe("stub");
  });

  it("drops dangling relations and counts them", () => {
    const { edges, danglingCount } = toFlow(unresolved as SchemaModel);
    expect(edges.filter((e) => e.data!.kind === "relation")).toHaveLength(0);
    expect(danglingCount).toBe(1);
  });
});
