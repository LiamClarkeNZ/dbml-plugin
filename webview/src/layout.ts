import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { FlowEdge, FlowNode } from "./transform";

const elk = new ELK();

const NODE_WIDTH = 240;
const TABLE_HEADER = 36;
const TABLE_ROW = 24;
const ENUM_HEADER = 28;
const ENUM_ROW = 22;
const PADDING = 12;

export function estimateSize(node: FlowNode): { width: number; height: number } {
  if (node.type === "table") {
    const t = node.data.table;
    const indexRows = t.indexes.length > 0 ? t.indexes.length + 1 : 0; // +1 divider
    const rows = t.columns.length + indexRows;
    return { width: NODE_WIDTH, height: TABLE_HEADER + rows * TABLE_ROW + PADDING };
  }
  const values = node.data.enum.values.length;
  return { width: NODE_WIDTH, height: ENUM_HEADER + values * ENUM_ROW + PADDING };
}

export async function layout(
  nodes: FlowNode[],
  edges: FlowEdge[],
): Promise<FlowNode[]> {
  const sizes = new Map(nodes.map((n) => [n.id, estimateSize(n)]));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
      "elk.spacing.nodeNode": "50",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    },
    children: nodes.map((n) => ({ id: n.id, ...sizes.get(n.id)! })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const result = await elk.layout(graph);
  const positions = new Map(
    (result.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]),
  );

  return nodes.map((n) => {
    const size = sizes.get(n.id)!;
    return {
      ...n,
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      width: size.width,
      height: size.height,
      style: { width: size.width },
    };
  });
}
