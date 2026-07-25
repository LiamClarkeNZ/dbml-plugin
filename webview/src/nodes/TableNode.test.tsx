import { ReactFlowProvider } from "@xyflow/react";
import { render, screen } from "@testing-library/react";
import { type ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import type { TableModel } from "../schema";
import TableNode from "./TableNode";

const users: TableModel = {
  key: "users",
  name: "users",
  alias: "u",
  note: "application users",
  columns: [
    { name: "id", type: "int", pk: true, unique: false, notNull: false, increment: true, sourceOffset: 69 },
    { name: "email", type: "varchar", pk: false, unique: true, notNull: true, increment: false, note: "login email", sourceOffset: 94 },
  ],
  indexes: [{ columns: ["id", "email"], pk: false, unique: true, sourceOffset: 200 }],
  sourceOffset: 54,
};

// The component only reads `data`; build props via ComponentProps to avoid
// enumerating the full NodeProps surface (which varies across @xyflow versions).
function renderNode(table: typeof users = users) {
  const props = { data: { table } } as unknown as ComponentProps<typeof TableNode>;
  return render(
    <ReactFlowProvider>
      <TableNode {...props} />
    </ReactFlowProvider>,
  );
}

describe("TableNode", () => {
  it("renders the header with alias and the columns", () => {
    renderNode();
    expect(screen.getByText(/users/)).toBeInTheDocument();
    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("email")).toBeInTheDocument();
  });

  it("marks the primary key and unique columns and exposes offsets", () => {
    renderNode();
    const idRow = screen.getByText("id").closest("[data-kind='column']")!;
    expect(idRow).toHaveAttribute("data-offset", "69");
    expect(idRow.textContent).toContain("PK");
    const emailRow = screen.getByText("email").closest("[data-kind='column']")!;
    expect(emailRow.textContent).toContain("U");
    expect(emailRow.textContent).toContain("NN");
  });

  // data-tip, not title: a native tooltip never renders in JCEF's offscreen browser, so the webview
  // draws its own from this attribute. See useTooltip in src/tooltip.tsx.
  it("exposes notes for the tooltip", () => {
    renderNode();
    const header = screen.getByText(/users/).closest("[data-kind='table']")!;
    expect(header).toHaveAttribute("data-tip", "application users");
    const emailRow = screen.getByText("email").closest("[data-kind='column']")!;
    expect(emailRow).toHaveAttribute("data-tip", "login email");
  });

  it("renders indexes in a footer", () => {
    renderNode();
    const idx = screen.getByText("id, email");
    expect(idx).toBeInTheDocument();
    expect(idx.closest("[data-kind='index']")!.textContent).toContain("U");
  });

  it("tints the header with the author's colour and picks readable ink", () => {
    const table = { ...users, headerColor: "#b19888" };
    renderNode(table);
    const header = document.querySelector(".dbml-node__header") as HTMLElement;
    expect(header.style.background).toBe("rgb(177, 152, 136)");
    expect(header.style.color).toBe("rgb(26, 26, 26)");
  });

  it("leaves the header themed when no colour is set", () => {
    renderNode(users);
    const header = document.querySelector(".dbml-node__header") as HTMLElement;
    expect(header.style.background).toBe("");
    expect(header.style.color).toBe("");
  });

  it("labels badges with their full constraint name", () => {
    renderNode();
    const pk = document.querySelector('[data-tip="PRIMARY KEY"]') as HTMLElement;
    expect(pk.textContent).toBe("PK");
    expect(document.querySelector('[data-tip="AUTO INCREMENT"]')).not.toBeNull();
  });
});
