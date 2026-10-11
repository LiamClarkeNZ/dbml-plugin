import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import sample from "./fixtures/sample-schema.json";
import { DARK_THEME, LIGHT_THEME } from "./theme";

// Dev-only harness: a light/dark toggle and an auto-render of the sample fixture.
// `import.meta.env.DEV` is a literal `false` in production, so Vite dead-code
// eliminates this branch (and tree-shakes Dev/sample/theme) from the plugin bundle.
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

if (import.meta.env.DEV) {
  root.render(
    <StrictMode>
      <Dev />
    </StrictMode>,
  );
  window.__onNavigate = (p) => console.log("navigate", p);
  // Render once App has installed window.render (its mount effect).
  setTimeout(() => window.render(JSON.stringify(sample), "dev-1"), 0);
} else {
  // Production: Kotlin drives window.render / applyTheme after the ready handshake.
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
