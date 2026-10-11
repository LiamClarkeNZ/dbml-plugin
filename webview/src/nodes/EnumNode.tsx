import { Handle, type NodeProps, Position } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import type { EnumNodeData } from "../transform";
import "./nodes.css";

type Props = NodeProps<Node<EnumNodeData, "enum">>;

export default function EnumNode({ data }: Props) {
  const model = data.enum;
  return (
    <div className="dbml-node">
      <Handle type="target" position={Position.Left} id="__enum" />
      <div className="dbml-node__header" data-kind="enum" data-offset={model.sourceOffset}>
        enum {model.name}
      </div>
      {model.values.map((v) => (
        <div className="dbml-enum__value" key={v}>
          {v}
        </div>
      ))}
    </div>
  );
}
