import type { Cardinality } from "../schema";
import type { FlowEdge } from "../transform";

type End = "one" | "many";

const ENDS: Record<Cardinality, { start: End; end: End }> = {
  ONE_TO_ONE: { start: "one", end: "one" },
  ONE_TO_MANY: { start: "one", end: "many" },
  MANY_TO_ONE: { start: "many", end: "one" },
  MANY_TO_MANY: { start: "many", end: "many" },
};

const ref = (end: End): string => `url(#dbml-${end})`;

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
