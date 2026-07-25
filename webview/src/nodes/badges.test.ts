import { describe, expect, it } from "vitest";
import { contrastRatio } from "../colour";
import { BADGES } from "./badges";

describe("BADGES", () => {
  it("names every constraint in full for the tooltip", () => {
    expect(BADGES.pk.title).toBe("PRIMARY KEY");
    expect(BADGES.u.title).toBe("UNIQUE");
    expect(BADGES.nn.title).toBe("NOT NULL");
    expect(BADGES.ai.title).toBe("AUTO INCREMENT");
  });

  it("keeps every badge readable", () => {
    for (const [kind, badge] of Object.entries(BADGES)) {
      expect(contrastRatio(badge.fg, badge.bg), kind).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives each kind a distinct hue", () => {
    const backgrounds = Object.values(BADGES).map((b) => b.bg);
    expect(new Set(backgrounds).size).toBe(backgrounds.length);
  });
});
