import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tooltip, useTooltip } from "./tooltip";

/** Minimal host: the same delegation App uses, over two nested tip-bearing elements. */
function Harness() {
  const { tip, onMouseOver, onMouseOut } = useTooltip();
  return (
    <div onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <div data-tip="Login identifier" data-testid="row">
        row text
        <span data-tip="PRIMARY KEY" data-testid="badge">
          PK
        </span>
      </div>
      <span data-testid="plain">no tip here</span>
      <Tooltip tip={tip} />
    </div>
  );
}

const tooltipText = () => document.querySelector(".dbml-tooltip")?.textContent ?? null;

describe("tooltip", () => {
  it("shows nothing until something with a tip is hovered", () => {
    render(<Harness />);
    expect(tooltipText()).toBeNull();
  });

  it("shows the hovered element's tip", () => {
    const { getByTestId } = render(<Harness />);
    fireEvent.mouseOver(getByTestId("row"));
    expect(tooltipText()).toBe("Login identifier");
  });

  it("prefers the innermost tip, matching how nested title attributes behave", () => {
    const { getByTestId } = render(<Harness />);
    fireEvent.mouseOver(getByTestId("badge"));
    expect(tooltipText()).toBe("PRIMARY KEY");
  });

  it("clears on mouse out", () => {
    const { getByTestId } = render(<Harness />);
    fireEvent.mouseOver(getByTestId("badge"));
    expect(tooltipText()).toBe("PRIMARY KEY");
    fireEvent.mouseOut(getByTestId("badge"));
    expect(tooltipText()).toBeNull();
  });

  it("ignores elements carrying no tip", () => {
    const { getByTestId } = render(<Harness />);
    fireEvent.mouseOver(getByTestId("plain"));
    expect(tooltipText()).toBeNull();
  });
});
