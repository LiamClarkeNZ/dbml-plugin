import { describe, expect, it } from "vitest";
import sample from "./fixtures/sample-schema.json";
import type { SchemaModel } from "./schema";

describe("sample fixture conforms to the contract", () => {
  const schema = sample as SchemaModel;

  it("has three tables keyed by lower-cased identity", () => {
    expect(schema.tables.map((t) => t.key)).toEqual(["users", "posts", "comments"]);
  });

  it("carries column flags and omits null fields", () => {
    const users = schema.tables[0];
    expect(users.alias).toBe("u");
    const id = users.columns[0];
    expect(id.name).toBe("id");
    expect(id.pk).toBe(true);
    expect(id.increment).toBe(true);
    expect(id.default).toBeUndefined(); // omitted, not null
  });

  it("relations reference tables by key and columns by name", () => {
    const rel = schema.relations[0];
    expect(rel.fromTable).toBe("posts");
    expect(rel.fromColumns).toEqual(["user_id"]);
    expect(rel.toTable).toBe("users");
    expect(rel.cardinality).toBe("MANY_TO_ONE");
    expect(rel.resolved).toBe(true);
  });

  it("groups reference member tables by key", () => {
    expect(schema.groups[0].tableKeys).toEqual(["users", "posts", "comments"]);
  });
});
