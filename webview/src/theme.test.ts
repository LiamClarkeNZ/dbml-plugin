import { describe, expect, it } from "vitest";
import { applyTheme, CSS_VARS, DARK_THEME } from "./theme";

describe("applyTheme", () => {
  it("sets every documented variable from the dark theme", () => {
    const root = document.createElement("div");
    applyTheme(DARK_THEME, root);
    for (const name of CSS_VARS) {
      expect(root.style.getPropertyValue(name)).not.toBe("");
    }
  });

  it("ignores unknown keys", () => {
    const root = document.createElement("div");
    applyTheme({ "--not-a-real-var": "red" }, root);
    expect(root.style.getPropertyValue("--not-a-real-var")).toBe("");
  });
});
