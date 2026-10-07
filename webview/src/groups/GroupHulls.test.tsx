import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GroupHulls } from "./GroupHulls";
import type { Hull } from "./hulls";

const hull: Hull = { name: "core", x: 10, y: 20, width: 300, height: 200 };

const hullElement = () =>
  document.querySelector("[data-group-hull]") as HTMLElement | null;

describe("GroupHulls", () => {
  it("sits behind the nodes, so its translucent fill cannot wash over a table", () => {
    render(<GroupHulls hulls={[hull]} />);
    // ViewportPortal inserts its children after React Flow's node layer, so without this the fill
    // paints over every table inside the group. React Flow's own Background uses the same z-index.
    expect(hullElement()?.style.zIndex).toBe("-1");
  });

  it("ignores pointer events so it never swallows a click meant for a node", () => {
    render(<GroupHulls hulls={[hull]} />);
    expect(hullElement()?.style.pointerEvents).toBe("none");
  });

  it("labels the group and tints from its colour when one is set", () => {
    const { getByText } = render(
      <GroupHulls hulls={[{ ...hull, name: "catalogue", colour: "#7c9772" }]} />,
    );
    expect(getByText("catalogue")).toBeInTheDocument();
  });
});
