// These hues are fixed rather than derived from the editor scheme because they encode meaning,
// not surface; each chip carries its own background and ink so it reads on a light or dark node alike.
export const BADGES = {
  pk: { label: "PK", title: "PRIMARY KEY", bg: "#5a4a1f", fg: "#f0d69a" },
  ai: { label: "AI", title: "AUTO INCREMENT", bg: "#22405e", fg: "#a9c7ee" },
  u: { label: "U", title: "UNIQUE", bg: "#3f3059", fg: "#d8c4f5" },
  nn: { label: "NN", title: "NOT NULL", bg: "#1f4a45", fg: "#9ce0d6" },
} as const;

export type BadgeKind = keyof typeof BADGES;
