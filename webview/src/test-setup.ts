import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// Rendered nodes only appear after the async ELK layout resolves. The first layout in a run pays
// ELK's start-up cost: ~0.7s on a typical CI runner and over 1s on a slow one, which overran the
// 1s waitFor default. 5s keeps a wide margin without hiding a genuinely stuck render.
configure({ asyncUtilTimeout: 5000 });

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  })) as unknown as typeof window.matchMedia;
}

if (!("DOMMatrixReadOnly" in globalThis)) {
  class DOMMatrixReadOnlyStub {
    m22 = 1;
    constructor(_t?: string) {}
  }
  // @ts-expect-error minimal stub for @xyflow/react in jsdom
  globalThis.DOMMatrixReadOnly = DOMMatrixReadOnlyStub;
}
