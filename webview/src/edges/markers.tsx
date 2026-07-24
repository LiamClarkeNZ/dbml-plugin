export function MarkerDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <marker
          id="dbml-one"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="12"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <path d="M6,1 L6,11" stroke="var(--dbml-edge)" strokeWidth="1.5" fill="none" />
        </marker>
        <marker
          id="dbml-many"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="14"
          markerHeight="14"
          orient="auto-start-reverse"
        >
          <path
            d="M11,1 L1,6 L11,11"
            stroke="var(--dbml-edge)"
            strokeWidth="1.5"
            fill="none"
          />
        </marker>
      </defs>
    </svg>
  );
}
