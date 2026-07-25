import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkerDefs } from "./markers";

describe("MarkerDefs", () => {
  it("renders a custom colour's marker with a bare element id, not a url() wrapper", () => {
    render(<MarkerDefs tokens={[{ kind: "custom", hex: "#5b7fbd" }]} />);

    const marker = document.getElementById("dbml-many--c-5b7fbd");
    expect(marker).not.toBeNull();
    expect(marker!.tagName.toLowerCase()).toBe("marker");
    expect(marker!.getAttribute("id")).toBe("dbml-many--c-5b7fbd");
    expect(marker!.getAttribute("id")).not.toContain("url(");
  });

  it("always renders the default and highlight role variants", () => {
    render(<MarkerDefs />);

    expect(document.getElementById("dbml-one--default")).not.toBeNull();
    expect(document.getElementById("dbml-many--default")).not.toBeNull();
    expect(document.getElementById("dbml-one--highlight")).not.toBeNull();
    expect(document.getElementById("dbml-many--highlight")).not.toBeNull();
  });
});
