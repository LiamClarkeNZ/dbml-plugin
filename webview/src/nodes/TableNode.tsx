import { Handle, type NodeProps, Position } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import { useContext } from "react";
import { readableInkOn } from "../colour";
import { HighlightContext } from "../highlight";
import { columnRowId, type TableNodeData } from "../transform";
import { BADGES, type BadgeKind } from "./badges";
import "./nodes.css";

type Props = NodeProps<Node<TableNodeData, "table">>;

function Badge({ kind }: { kind: BadgeKind }) {
  const badge = BADGES[kind];
  return (
    <span
      className="dbml-badge"
      style={{ background: badge.bg, color: badge.fg }}
      title={badge.title}
    >
      {badge.label}
    </span>
  );
}

export default function TableNode({ data }: Props) {
  const { table } = data;
  const highlight = useContext(HighlightContext);
  const headerStyle = table.headerColor
    ? { background: table.headerColor, color: readableInkOn(table.headerColor) }
    : undefined;
  return (
    <div className="dbml-node">
      <div
        className="dbml-node__header"
        style={headerStyle}
        data-kind="table"
        data-offset={table.sourceOffset}
        title={table.note}
      >
        {table.name}
        {table.alias ? <span className="dbml-node__alias"> ({table.alias})</span> : null}
      </div>
      {table.columns.map((col) => (
        <div
          className={
            highlight.columns.has(columnRowId(table.key, col.name))
              ? "dbml-row dbml-row--highlight"
              : "dbml-row"
          }
          key={col.name}
          data-kind="column"
          data-table={table.key}
          data-column={col.name}
          data-offset={col.sourceOffset}
          title={col.note}
        >
          <Handle type="target" position={Position.Left} id={col.name} />
          {col.pk ? <Badge kind="pk" /> : null}
          {col.unique ? <Badge kind="u" /> : null}
          {col.notNull ? <Badge kind="nn" /> : null}
          {col.increment ? <Badge kind="ai" /> : null}
          <span className="dbml-row__name">{col.name}</span>
          <span className="dbml-row__type">{col.type}</span>
          <Handle type="source" position={Position.Right} id={col.name} />
        </div>
      ))}
      {table.indexes.length > 0 ? (
        <div className="dbml-node__indexes">
          {table.indexes.map((idx) => (
            <div className="dbml-index" key={idx.sourceOffset} data-kind="index" data-offset={idx.sourceOffset}>
              {idx.pk ? <Badge kind="pk" /> : null}
              {idx.unique ? <Badge kind="u" /> : null}
              <span>{idx.columns.join(", ")}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
