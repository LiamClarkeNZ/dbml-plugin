// Diagram geometry in pixels, in one place so layout, hulls and CSS stay in step.

/** Width of a table or enum node. Must match `.dbml-node { width }` in nodes/nodes.css. */
export const NODE_WIDTH = 240;

// Height estimates used to lay out nodes before React Flow has measured them.
export const TABLE_HEADER_HEIGHT = 36;
export const TABLE_ROW_HEIGHT = 24;
export const ENUM_HEADER_HEIGHT = 28;
export const ENUM_ROW_HEIGHT = 22;
export const NODE_VERTICAL_PADDING = 12;

/** Side/bottom padding around a group's member nodes. Also the ELK group parent's padding, so
 * the box ELK reserves matches the hull drawn around it. */
export const HULL_PAD = 28;
/** The label chip sits inside the hull, so the top needs a band of its own: enough for the chip
 * plus clear space, otherwise the chip reads as sitting on top of the first table. */
export const HULL_PAD_TOP = 48;

/** ELK gap between layers (columns, since the layout flows left to right). */
export const LAYER_SPACING = 90;
/** ELK gap between nodes within a layer. */
export const NODE_SPACING = 50;
