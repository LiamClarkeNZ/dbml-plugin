import type { Edge, Node } from "@xyflow/react";
import type {
  Cardinality,
  EnumModel,
  RelationModel,
  SchemaModel,
  TableModel,
} from "./schema";

export interface TableNodeData extends Record<string, unknown> {
  table: TableModel;
}
export interface EnumNodeData extends Record<string, unknown> {
  enum: EnumModel;
}

export type FlowNode =
  | Node<TableNodeData, "table">
  | Node<EnumNodeData, "enum">;

export interface EdgeData extends Record<string, unknown> {
  cardinality: Cardinality;
  kind: "relation" | "enum";
  /** Author colour from a standalone Ref's `color` setting. */
  colour?: string;
}
export type FlowEdge = Edge<EdgeData>;

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  danglingCount: number;
}

export const tableNodeId = (key: string): string => key;
export const enumNodeId = (key: string): string => `enum:${key}`;
export const columnHandleId = (columnName: string): string => columnName;

/** Edge id for a relation. Shared with selection.ts so the format cannot drift. */
export const relationEdgeId = (r: RelationModel): string =>
  `rel:${r.fromTable}.${columnHandleId(r.fromColumns[0])}->${r.toTable}.${columnHandleId(r.toColumns[0])}`;

export const columnRowId = (tableKey: string, column: string): string => `${tableKey}.${column}`;

export function toFlow(schema: SchemaModel): FlowData {
  const tableKeys = new Set(schema.tables.map((t) => t.key));
  const enumKeys = new Set(schema.enums.map((e) => e.key));

  const nodes: FlowNode[] = [
    ...schema.tables.map<FlowNode>((table) => ({
      id: tableNodeId(table.key),
      type: "table",
      position: { x: 0, y: 0 },
      data: { table },
    })),
    ...schema.enums.map<FlowNode>((e) => ({
      id: enumNodeId(e.key),
      type: "enum",
      position: { x: 0, y: 0 },
      data: { enum: e },
    })),
  ];

  const edges: FlowEdge[] = [];
  let danglingCount = 0;

  for (const r of schema.relations) {
    if (!tableKeys.has(r.fromTable) || !tableKeys.has(r.toTable)) {
      danglingCount += 1;
      continue;
    }
    const sourceHandle = columnHandleId(r.fromColumns[0]);
    const targetHandle = columnHandleId(r.toColumns[0]);
    edges.push({
      id: relationEdgeId(r),
      source: r.fromTable,
      sourceHandle,
      target: r.toTable,
      targetHandle,
      type: "stub",
      data: { cardinality: r.cardinality, kind: "relation", colour: r.color },
    });
  }

  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (enumKeys.has(col.type)) {
        edges.push({
          id: `enumref:${table.key}.${col.name}->${enumNodeId(col.type)}`,
          source: table.key,
          sourceHandle: columnHandleId(col.name),
          target: enumNodeId(col.type),
          type: "stub",
          data: { cardinality: "MANY_TO_ONE", kind: "enum" },
        });
      }
    }
  }

  return { nodes, edges, danglingCount };
}
