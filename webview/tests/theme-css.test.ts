// @vitest-environment node
// Lives outside src/ because it reads sources from disk: vitest stubs CSS imports (css: false),
// and tsconfig deliberately keeps node types out of the browser sources.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CSS_VARS } from "../src/theme";

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), "utf8");

const srcFiles = (extension: string): string[] =>
  readdirSync(new URL("../src", import.meta.url), { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(extension))
    .map((name) => `../src/${name}`);

describe("theme.css", () => {
  const css = read("../src/theme.css");

  it("declares a fallback default for every documented variable", () => {
    for (const name of CSS_VARS) {
      expect(css).toContain(`${name}:`);
    }
  });

  // Only fallback-less references are enforced: var(--x, default) degrades on its own, whereas a
  // typo in var(--x) resolves to nothing at all.
  it("only references documented variables without a fallback", () => {
    const files = srcFiles(".css");
    expect(files.length).toBeGreaterThan(1);
    for (const file of files) {
      const referenced = [...read(file).matchAll(/var\((--dbml-[a-z-]+)\s*\)/g)].map((m) => m[1]);
      for (const name of new Set(referenced)) {
        expect(CSS_VARS, `${file} references ${name}`).toContain(name);
      }
    }
  });

  // The --xy-* overrides are React Flow's documented theming hook: it reads a middle tier of
  // variables it never defines itself. If an upgrade renames one, the chrome silently reverts to
  // the library's light defaults, so pin the names against the shipped stylesheet.
  it("maps only --xy-* variables React Flow reads", () => {
    const libCss = read("../node_modules/@xyflow/react/dist/style.css").replace(/\s+/g, "");
    const mapped = [...css.matchAll(/(--xy-[a-z-]+):/g)].map((m) => m[1]);
    expect(mapped.length).toBeGreaterThan(0);
    for (const name of mapped) {
      expect(libCss).toContain(`var(${name},`);
    }
  });
});
