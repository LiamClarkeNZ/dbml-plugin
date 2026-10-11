export const INK_DARK = "#1a1a1a";
export const INK_LIGHT = "#f5f5f5";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(hex: string): [number, number, number] | null {
  const digits = HEX.exec(hex)?.[1];
  if (!digits) return null;
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((d) => d + d)
          .join("")
      : digits;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG relative luminance, gamma-corrected. */
export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const ra = parseHex(a);
  const rb = parseHex(b);
  if (!ra || !rb) return 1;
  const la = relativeLuminance(ra);
  const lb = relativeLuminance(rb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Picks whichever ink contrasts better with an author-chosen colour. The DBML file decides the
 * surface; legibility on it is a presentation concern, so it is decided here rather than in the model.
 */
export function readableInkOn(hex: string): string {
  if (!parseHex(hex)) return "inherit";
  return contrastRatio(INK_DARK, hex) >= contrastRatio(INK_LIGHT, hex) ? INK_DARK : INK_LIGHT;
}
