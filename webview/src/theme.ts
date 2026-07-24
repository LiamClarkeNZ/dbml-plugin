export const CSS_VARS = [
  "--dbml-bg",
  "--dbml-fg",
  "--dbml-node-bg",
  "--dbml-header-bg",
  "--dbml-border",
  "--dbml-row-hover",
  "--dbml-badge-bg",
  "--dbml-badge-fg",
  "--dbml-edge",
] as const;

const VAR_SET = new Set<string>(CSS_VARS);

export const LIGHT_THEME: Record<string, string> = {
  "--dbml-bg": "#ffffff",
  "--dbml-fg": "#1e1e1e",
  "--dbml-node-bg": "#ffffff",
  "--dbml-header-bg": "#eef1f5",
  "--dbml-border": "#c8ccd4",
  "--dbml-row-hover": "#f0f4fa",
  "--dbml-badge-bg": "#dbe4f0",
  "--dbml-badge-fg": "#26456e",
  "--dbml-edge": "#6b7280",
};

export const DARK_THEME: Record<string, string> = {
  "--dbml-bg": "#1e1f22",
  "--dbml-fg": "#dfe1e5",
  "--dbml-node-bg": "#2b2d30",
  "--dbml-header-bg": "#3c3f43",
  "--dbml-border": "#4b4d51",
  "--dbml-row-hover": "#34373b",
  "--dbml-badge-bg": "#3b4a5f",
  "--dbml-badge-fg": "#a9c7ee",
  "--dbml-edge": "#8b909a",
};

export function applyTheme(
  vars: Record<string, string>,
  root: HTMLElement = document.documentElement,
): void {
  for (const [name, value] of Object.entries(vars)) {
    if (VAR_SET.has(name)) {
      root.style.setProperty(name, value);
    }
  }
}
