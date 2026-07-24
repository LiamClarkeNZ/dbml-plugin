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
            border: "1px dashed var(--dbml-border)",
            borderRadius: 8,
            background: "color-mix(in srgb, var(--dbml-header-bg) 40%, transparent)",
            pointerEvents: "none",
          }}
        >
          <div style={{ position: "absolute", top: -18, left: 4, fontSize: 11, opacity: 0.8 }}>
            {h.name}
          </div>
        </div>
      ))}
    </>
  );
}
