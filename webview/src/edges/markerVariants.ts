import type { FlowEdge } from "../transform";

/**
 * Which stroke a marker should use. Role tokens are recoloured by CSS, so an applyTheme push
 * repaints them with no re-render; a custom token carries an author colour and is set inline.
 */
export type ColourToken =
  | { kind: "role"; role: "default" | "highlight" }
  | { kind: "custom"; hex: string };

export const DEFAULT_TOKEN: ColourToken = { kind: "role", role: "default" };
export const HIGHLIGHT_TOKEN: ColourToken = { kind: "role", role: "highlight" };

export const MARKER_ENDS = ["one", "many"] as const;
export type MarkerEnd = (typeof MARKER_ENDS)[number];

/**
 * Bare element id. React Flow renders string markers as url('#' + value), so a pre-wrapped
 * url(#id) would reference nothing.
 */
export function markerId(end: MarkerEnd, token: ColourToken): string {
  return token.kind === "role"
    ? `dbml-${end}--${token.role}`
    : `dbml-${end}--c-${token.hex.replace("#", "")}`;
}

export function customTokens(edges: FlowEdge[]): ColourToken[] {
  const seen = new Set<string>();
  const tokens: ColourToken[] = [];
  for (const edge of edges) {
    const hex = edge.data?.colour;
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    tokens.push({ kind: "custom", hex });
  }
  return tokens;
}
