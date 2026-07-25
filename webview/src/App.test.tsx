import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import sample from "./fixtures/sample-schema.json";
import parseErrors from "./fixtures/parse-errors-schema.json";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App render entrypoint", () => {
  it("renders tables passed via window.render", async () => {
    render(<App />);
    await act(async () => {
      window.render(JSON.stringify(sample), "h1");
    });
    await waitFor(() => expect(screen.getByText(/users/)).toBeInTheDocument());
  });

  it("shows a banner for parse errors", async () => {
    render(<App />);
    await act(async () => {
      window.render(JSON.stringify(parseErrors), "h2");
    });
    await waitFor(() =>
      expect(screen.getByText(/parse error/i)).toBeInTheDocument(),
    );
  });

  it("does not throw on malformed JSON", async () => {
    render(<App />);
    await act(async () => {
      window.render("{ not json", "h3");
    });
    await waitFor(() =>
      expect(screen.getByText(/could not render/i)).toBeInTheDocument(),
    );
  });

  it("emits navigation payload with offset on row click", async () => {
    const onNav = vi.fn();
    window.__onNavigate = onNav;
    render(<App />);
    await act(async () => {
      window.render(JSON.stringify(sample), "h4");
    });
    // "email" is unique across the sample (three columns are named "id").
    const emailRow = (await screen.findByText("email")).closest(
      "[data-kind='column']",
    ) as HTMLElement;
    await act(async () => {
      emailRow.click();
    });
    expect(onNav).toHaveBeenCalledWith({ kind: "column", offset: 94 });
  });

  it("highlights a relation and its columns when a column is clicked", async () => {
    render(<App />);
    window.render(JSON.stringify(sample), "h1");
    await waitFor(() => expect(document.querySelector(".dbml-node")).not.toBeNull());

    const row = document.querySelector('[data-kind="column"][data-table="posts"][data-column="user_id"]');
    expect(row).not.toBeNull();
    fireEvent.click(row as HTMLElement);

    await waitFor(() =>
      expect(document.querySelectorAll(".dbml-row--highlight").length).toBeGreaterThan(0),
    );
  });

  it("clears the highlight on Escape", async () => {
    render(<App />);
    window.render(JSON.stringify(sample), "h1");
    await waitFor(() => expect(document.querySelector(".dbml-node")).not.toBeNull());
    fireEvent.click(document.querySelector('[data-kind="column"][data-table="posts"][data-column="user_id"]') as HTMLElement);
    await waitFor(() => expect(document.querySelectorAll(".dbml-row--highlight").length).toBeGreaterThan(0));

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(document.querySelectorAll(".dbml-row--highlight").length).toBe(0));
  });
});
