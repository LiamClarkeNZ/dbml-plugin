import { BaseEdge, type EdgeProps, getBezierPath, Position } from "@xyflow/react";

/** Long enough to clear the 12px marker with a little air. */
export const STUB_LENGTH = 14;

interface StubPathParams {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}

/**
 * A bezier with a straight lead-in and lead-out. Markers orient to the tangent at the endpoint, so a
 * straight final segment keeps the crow's foot aligned with the line and clear of the node border.
 *
 * The params accept any `Position`, but the inset below is unconditionally horizontal
 * (`sourceX + STUB_LENGTH`, `targetX - STUB_LENGTH`), which is only correct for a source-Right,
 * target-Left handle pair. Every handle in this app is exactly that pair, so this is not a live bug,
 * but the signature promises more generality than the body delivers.
 */
export function stubPath(params: StubPathParams): string {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = params;
  const fromX = sourceX + STUB_LENGTH;
  const toX = targetX - STUB_LENGTH;
  const [curve] = getBezierPath({
    sourceX: fromX,
    sourceY,
    sourcePosition,
    targetX: toX,
    targetY,
    targetPosition,
  });
  // getBezierPath always emits a "C" segment; guard anyway rather than let a -1 silently slice
  // the last character off the path and emit garbage.
  const cIndex = curve.indexOf("C");
  const curveFromC = cIndex === -1 ? curve : curve.slice(cIndex);
  return `M${sourceX},${sourceY} L${fromX},${sourceY} ${curveFromC} L${targetX},${targetY}`;
}

export default function StubEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerStart,
  markerEnd,
  interactionWidth,
}: EdgeProps) {
  const path = stubPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return (
    <BaseEdge
      path={path}
      style={style}
      markerStart={markerStart}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
    />
  );
}
