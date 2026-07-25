import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import { HULL_PAD, HULL_PAD_TOP } from "./groups/hulls";
import type { GroupModel } from "./schema";
import type { FlowEdge, FlowNode } from "./transform";
import { tableNodeId } from "./transform";

const elk = new ELK();

const NODE_WIDTH = 240;
const TABLE_HEADER = 36;
const TABLE_ROW = 24;
const ENUM_HEADER = 28;
const ENUM_ROW = 22;
const PADDING = 12;

// Padding for a synthetic group parent node, expressed in ELK's own padding syntax. Kept equal
// to what GroupHulls actually draws (HULL_PAD / HULL_PAD_TOP) so the ELK-derived group box and
// the hull drawn around it agree; see hulls.ts for why the top gets extra room.
const GROUP_PADDING = `[top=${HULL_PAD_TOP}.0,left=${HULL_PAD}.0,right=${HULL_PAD}.0,bottom=${HULL_PAD}.0]`;

/** Id of the synthetic ELK parent node standing in for the group at this index. Prefixed so it
 * cannot collide with a real node id (table keys are used verbatim; enum ids are "enum:<key>"). */
const groupParentId = (index: number): string => `__group__${index}`;

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

/**
 * ELK reports a child's position relative to its parent; the canvas needs absolute coordinates.
 *
 * `children` is the top level of an ELK layout result (i.e. `result.children`, all direct
 * children of the implicit root, whose own origin is (0, 0)). Root-level children are therefore
 * already absolute. A `groupParentIds` member is a synthetic group parent: its own `x`/`y` is
 * its absolute origin, and each of its `children` (the real member nodes) gets that origin added
 * to its relative `x`/`y` exactly once.
 */
export function absolutePositions(
  children: ElkNode[],
  groupParentIds: Set<string>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  for (const child of children) {
    if (groupParentIds.has(child.id)) {
      const originX = child.x ?? 0;
      const originY = child.y ?? 0;
      for (const grandchild of child.children ?? []) {
        positions.set(grandchild.id, {
          x: originX + (grandchild.x ?? 0),
          y: originY + (grandchild.y ?? 0),
        });
      }
    } else {
      positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
    }
  }
  return positions;
}

export async function layout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  groups: GroupModel[] = [],
): Promise<FlowNode[]> {
  const sizes = new Map(nodes.map((n) => [n.id, estimateSize(n)]));
  const nodeIds = new Set(nodes.map((n) => n.id));

  // DBML does not forbid listing a table in more than one TableGroup, but an ELK node can only
  // have one parent. Resolve the conflict by assigning each table to the first group that claims
  // it (in declaration order) and ignoring the rest.
  const groupIndexByNodeId = new Map<string, number>();
  groups.forEach((group, groupIndex) => {
    for (const key of group.tableKeys) {
      const nodeId = tableNodeId(key);
      if (!nodeIds.has(nodeId) || groupIndexByNodeId.has(nodeId)) continue;
      groupIndexByNodeId.set(nodeId, groupIndex);
    }
  });

  // Bucket every node into its group's children, or straight onto the root if ungrouped.
  const childrenByGroupIndex = new Map<number, ElkNode[]>();
  const rootChildren: ElkNode[] = [];
  for (const n of nodes) {
    const elkNode: ElkNode = { id: n.id, ...sizes.get(n.id)! };
    const groupIndex = groupIndexByNodeId.get(n.id);
    if (groupIndex === undefined) {
      rootChildren.push(elkNode);
      continue;
    }
    const bucket = childrenByGroupIndex.get(groupIndex) ?? [];
    bucket.push(elkNode);
    childrenByGroupIndex.set(groupIndex, bucket);
  }

  // One synthetic parent per non-empty group. No fixed width/height: ELK derives the parent's
  // size from its children plus elk.padding.
  const groupParents: ElkNode[] = groups
    .map((group, groupIndex) => ({ group, groupIndex }))
    .filter(({ groupIndex }) => childrenByGroupIndex.has(groupIndex))
    .map(({ groupIndex }) => ({
      id: groupParentId(groupIndex),
      layoutOptions: { "elk.padding": GROUP_PADDING },
      children: childrenByGroupIndex.get(groupIndex)!,
    }));
  const groupParentIds = new Set(groupParents.map((p) => p.id));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      // Edges regularly cross from a node inside a group to one outside it, or in another
      // group entirely. This tells ELK Layered to route across the hierarchy instead of
      // treating each parent as an isolated sub-layout (which throws on cross-level edges).
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
      "elk.spacing.nodeNode": "50",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    },
    children: [...groupParents, ...rootChildren],
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const result = await elk.layout(graph);
  const positions = absolutePositions(result.children ?? [], groupParentIds);

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
