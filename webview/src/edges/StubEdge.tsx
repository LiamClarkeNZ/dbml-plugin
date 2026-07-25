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
  const curveFromC = curve.slice(curve.indexOf("C"));
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
