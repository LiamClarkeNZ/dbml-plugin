import type { SchemaModel } from "./schema";
import { columnRowId, relationEdgeId } from "./transform";

export type Target =
  // `table` is the normalised TableModel.key; `column` is the column name as written.
  | { kind: "column"; table: string; column: string }
  | { kind: "edge"; id: string };

export interface Highlight {
  edges: Set<string>;
  columns: Set<string>;
}

export const EMPTY_HIGHLIGHT: Highlight = { edges: new Set(), columns: new Set() };

/**
 * Every relation touching the target, plus the columns at both ends of each. Composite refs are keyed
 * on their first column, matching how toFlow builds edges.
 */
export function highlightFor(schema: SchemaModel, target: Target): Highlight {
  const edges = new Set<string>();
  const columns = new Set<string>();

  for (const r of schema.relations) {
    if (!r.resolved) continue;
    const id = relationEdgeId(r);
    const from = { table: r.fromTable, column: r.fromColumns[0] };
    const to = { table: r.toTable, column: r.toColumns[0] };
    const touches =
      target.kind === "edge"
        ? id === target.id
        : (from.table === target.table && from.column === target.column) ||
          (to.table === target.table && to.column === target.column);
    if (!touches) continue;
    edges.add(id);
    columns.add(columnRowId(from.table, from.column));
    columns.add(columnRowId(to.table, to.column));
  }

  return { edges, columns };
}
