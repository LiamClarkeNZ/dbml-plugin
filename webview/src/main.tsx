import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import sample from "./fixtures/sample-schema.json";
import { DARK_THEME, LIGHT_THEME } from "./theme";

function Dev() {
  const [dark, setDark] = useState(false);
  return (
    <>
      <button
        style={{ position: "absolute", top: 8, right: 8, zIndex: 20 }}
        onClick={() => {
          const next = !dark;
          setDark(next);
          window.applyTheme(next ? DARK_THEME : LIGHT_THEME);
        }}
      >
        {dark ? "Light" : "Dark"}
      </button>
      <App />
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <Dev />
  </StrictMode>,
);

window.__onNavigate = (p) => console.log("navigate", p);
// Render once the entrypoints are wired (App sets window.render on mount).
setTimeout(() => window.render(JSON.stringify(sample), "dev-1"), 0);
