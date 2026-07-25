import { type Hull } from "./hulls";

export function GroupHulls({ hulls }: { hulls: Hull[] }) {
  return (
    <>
      {hulls.map((h) => (
        <div
          key={h.name}
          style={{
            position: "absolute",
            transform: `translate(${h.x}px, ${h.y}px)`,
            width: h.width,
            height: h.height,
            border: `1px dashed ${h.colour ?? "var(--dbml-border)"}`,
            borderRadius: 8,
            background: "color-mix(in srgb, var(--dbml-header-bg) 40%, transparent)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 8,
              fontWeight: 600,
              fontSize: 10,
              fontFamily: "var(--dbml-font, sans-serif)",
              letterSpacing: "0.04em",
              color: "var(--dbml-fg)",
              background: h.colour
                ? `color-mix(in srgb, ${h.colour} 30%, transparent)`
                : "var(--dbml-badge-bg)",
              border: `1px solid ${h.colour ?? "var(--dbml-border)"}`,
              padding: "1px 6px",
              borderRadius: 9,
            }}
          >
            {h.name}
          </div>
        </div>
      ))}
    </>
  );
}
