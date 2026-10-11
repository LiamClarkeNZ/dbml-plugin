import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  INK_DARK,
  INK_LIGHT,
  parseHex,
  readableInkOn,
  relativeLuminance,
} from "./colour";

describe("parseHex", () => {
  it("parses both hex forms", () => {
    expect(parseHex("#ffffff")).toEqual([255, 255, 255]);
    expect(parseHex("#abc")).toEqual([170, 187, 204]);
    expect(parseHex("#B19888")).toEqual([177, 152, 136]);
  });

  it("rejects anything that is not a hex colour", () => {
    for (const bad of ["", "b19888", "#12", "#12345", "#gggggg", "red"]) {
      expect(parseHex(bad), bad).toBeNull();
    }
  });
});

describe("relativeLuminance", () => {
  it("spans black to white", () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});

describe("readableInkOn", () => {
  it("puts dark ink on light backgrounds and light ink on dark ones", () => {
    expect(readableInkOn("#ffffff")).toBe(INK_DARK);
    expect(readableInkOn("#b19888")).toBe(INK_DARK);
    expect(readableInkOn("#1e1f22")).toBe(INK_LIGHT);
    expect(readableInkOn("#22405e")).toBe(INK_LIGHT);
  });

  it("clears 4.5:1 against every DBML colour it picks ink for", () => {
    for (const bg of ["#ffffff", "#b19888", "#7c9772", "#1e1f22", "#22405e", "#61afef"]) {
      expect(contrastRatio(readableInkOn(bg), bg), bg).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("falls back to inherit for an unusable value", () => {
    expect(readableInkOn("not-a-colour")).toBe("inherit");
  });
});
