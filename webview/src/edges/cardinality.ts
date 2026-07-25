import type { Cardinality } from "../schema";
import type { FlowEdge } from "../transform";

type End = "one" | "many";

const ENDS: Record<Cardinality, { start: End; end: End }> = {
  ONE_TO_ONE: { start: "one", end: "one" },
  ONE_TO_MANY: { start: "one", end: "many" },
  MANY_TO_ONE: { start: "many", end: "one" },
  MANY_TO_MANY: { start: "many", end: "many" },
};

/**
 * Marker element ids, shared with MarkerDefs so a reference cannot drift from its definition.
 * These must stay bare ids: React Flow builds the reference itself as `url('#' + markerEnd)` for
 * string markers, so passing a pre-wrapped `url(#id)` yields `url('#url(#id)')` and paints nothing.
 */
export const MARKER_IDS = { one: "dbml-one", many: "dbml-many" } as const;

const ref = (end: End): string => MARKER_IDS[end];

export function edgeMarkers(cardinality: Cardinality): {
  markerStart: string;
  markerEnd: string;
} {
  const { start, end } = ENDS[cardinality];
  return { markerStart: ref(start), markerEnd: ref(end) };
}

export function applyEdgeStyling(edge: FlowEdge): FlowEdge {
  if (edge.data?.kind === "enum") {
    return { ...edge, style: { ...edge.style, strokeDasharray: "4 3" } };
  }
  const { markerStart, markerEnd } = edgeMarkers(edge.data!.cardinality);
  return { ...edge, markerStart, markerEnd };
}
