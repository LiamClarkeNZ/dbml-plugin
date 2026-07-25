import type { Cardinality } from "../schema";
import type { FlowEdge } from "../transform";
import { type ColourToken, DEFAULT_TOKEN, HIGHLIGHT_TOKEN, markerId } from "./markerVariants";

type End = "one" | "many";

const ENDS: Record<Cardinality, { start: End; end: End }> = {
  ONE_TO_ONE: { start: "one", end: "one" },
  ONE_TO_MANY: { start: "one", end: "many" },
  MANY_TO_ONE: { start: "many", end: "one" },
  MANY_TO_MANY: { start: "many", end: "many" },
};

export function edgeMarkers(
  cardinality: Cardinality,
  token: ColourToken = DEFAULT_TOKEN,
): { markerStart: string; markerEnd: string } {
  const { start, end } = ENDS[cardinality];
  return { markerStart: markerId(start, token), markerEnd: markerId(end, token) };
}

export function applyEdgeStyling(edge: FlowEdge): FlowEdge {
  const colour = edge.data?.colour;
  const stroke = colour ? { stroke: colour } : {};
  if (edge.data?.kind === "enum") {
    return { ...edge, style: { ...edge.style, ...stroke, strokeDasharray: "4 3" } };
  }
  const token: ColourToken = colour ? { kind: "custom", hex: colour } : DEFAULT_TOKEN;
  const { markerStart, markerEnd } = edgeMarkers(edge.data!.cardinality, token);
  return { ...edge, markerStart, markerEnd, style: { ...edge.style, ...stroke } };
}

/** Restyles an already-styled edge as highlighted, including its markers. */
export function withHighlight(edge: FlowEdge): FlowEdge {
  const style = { ...edge.style, stroke: "var(--dbml-accent)", strokeWidth: 2.5 };
  if (edge.data?.kind === "enum") return { ...edge, style };
  const { markerStart, markerEnd } = edgeMarkers(edge.data!.cardinality, HIGHLIGHT_TOKEN);
  return { ...edge, markerStart, markerEnd, style };
}
