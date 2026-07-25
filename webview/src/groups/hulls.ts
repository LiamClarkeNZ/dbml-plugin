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

/** Side/bottom padding around a group's member nodes. Shared with layout.ts so the ELK
 * parent node sizing (`elk.padding`) stays consistent with what the hull actually draws. */
export const HULL_PAD = 28;
/** The label chip sits inside the hull, so the top needs a band of its own: enough for the chip
 * plus clear space, otherwise the chip reads as sitting on top of the first table. Shared with
 * layout.ts for the same reason as HULL_PAD. */
export const HULL_PAD_TOP = 48;

export function computeHulls(
  groups: GroupModel[],
  nodes: FlowNode[],
  pad = HULL_PAD,
  padTop = HULL_PAD_TOP,
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
  // Hulls are translucent and stack in DOM order, so a group whose bounding box encloses another
  // would paint over it. Largest first puts the enclosing group behind the one it contains.
  return hulls.sort((a, b) => b.width * b.height - a.width * a.height);
}
