import { type MouseEvent as ReactMouseEvent, useCallback, useState } from "react";

export interface Tip {
  text: string;
  x: number;
  y: number;
}

/**
 * Hover tooltips, rendered in the DOM rather than via the `title` attribute.
 *
 * A native tooltip never appears in this preview. JCEF renders offscreen by default
 * (`ide.browser.jcef.osr.enabled=true`), and a windowless browser has no window to draw one in, so
 * Chromium delegates to `CefDisplayHandler.onTooltip`; the platform's handler only forwards to
 * registered display handlers and returns false, which asks for a default implementation that does
 * not exist off-screen. Drawing our own also lets the tooltip follow the editor palette.
 *
 * Attach the handlers once to a container and mark any descendant with `data-tip`; the nearest
 * ancestor wins, which is how nested `title` attributes used to behave.
 */
export function useTooltip() {
  const [tip, setTip] = useState<Tip | null>(null);

  const onMouseOver = useCallback((event: ReactMouseEvent) => {
    const el = (event.target as HTMLElement).closest?.("[data-tip]") as HTMLElement | null;
    const text = el?.getAttribute("data-tip");
    if (!el || !text) {
      setTip(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTip({ text, x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const onMouseOut = useCallback(() => setTip(null), []);

  return { tip, onMouseOver, onMouseOut };
}

/**
 * Positioned with `fixed` against viewport coordinates, so it is unaffected by the canvas transform
 * and escapes the node's `overflow: hidden` instead of being clipped at the node's edge.
 */
export function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div className="dbml-tooltip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
      {tip.text}
    </div>
  );
}
