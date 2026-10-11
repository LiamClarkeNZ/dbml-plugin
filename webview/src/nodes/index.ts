import type { NodeTypes } from "@xyflow/react";
import EnumNode from "./EnumNode";
import TableNode from "./TableNode";

export const nodeTypes: NodeTypes = { table: TableNode, enum: EnumNode };
