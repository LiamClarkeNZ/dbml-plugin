import { type ColourToken, DEFAULT_TOKEN, HIGHLIGHT_TOKEN, markerId } from "./markerVariants";

const MARKER_PATHS = { one: "M6,1 L6,11", many: "M11,1 L1,6 L11,11" } as const;

function MarkerPair({ token }: { token: ColourToken }) {
  const style = token.kind === "custom" ? { stroke: token.hex } : undefined;
  const className = token.kind === "custom" ? "dbml-marker" : `dbml-marker dbml-marker--${token.role}`;
  return (
    <>
      {(["one", "many"] as const).map((end) => (
        <marker
          key={end}
          id={markerId(end, token)}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth={end === "many" ? 14 : 12}
          markerHeight={end === "many" ? 14 : 12}
          orient="auto-start-reverse"
        >
          <path className={className} style={style} d={MARKER_PATHS[end]} />
        </marker>
      ))}
    </>
  );
}

export function MarkerDefs({ tokens = [] }: { tokens?: ColourToken[] }) {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <MarkerPair token={DEFAULT_TOKEN} />
        <MarkerPair token={HIGHLIGHT_TOKEN} />
        {tokens.map((token) => (
          <MarkerPair key={markerId("one", token)} token={token} />
        ))}
      </defs>
    </svg>
  );
}
