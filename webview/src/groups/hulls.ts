import type { GroupModel } from "../schema";
import type { FlowNode } from "../transform";
import { tableNodeId } from "../transform";

export interface Hull {
  name: string;
  colour?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeHulls(
  groups: GroupModel[],
  nodes: FlowNode[],
  pad = 16,
  // The label chip sits inside the hull, so the top needs room the other sides do not.
  padTop = 28,
): Hull[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const hulls: Hull[] = [];

  for (const group of groups) {
    const members = group.tableKeys
      .map((k) => byId.get(tableNodeId(k)))
      .filter((n): n is FlowNode => n !== undefined);
    if (members.length === 0) continue;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const m of members) {
      const w = m.width ?? 240;
      const h = m.height ?? 80;
      minX = Math.min(minX, m.position.x);
      minY = Math.min(minY, m.position.y);
      maxX = Math.max(maxX, m.position.x + w);
      maxY = Math.max(maxY, m.position.y + h);
    }
    hulls.push({
      name: group.name,
      colour: group.color,
      x: minX - pad,
      y: minY - padTop,
      width: maxX - minX + pad * 2,
      height: maxY - minY + padTop + pad,
    });
  }
  return hulls;
}
