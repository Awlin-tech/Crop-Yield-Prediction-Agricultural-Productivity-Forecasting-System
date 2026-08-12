import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Field ledger" palette — mapped to CSS variables for dynamic Dark Mode support.
        paper: "var(--color-paper)",
        ink: "var(--color-ink)",
        canopy: "var(--color-canopy)",
        canopyDeep: "var(--color-canopy-deep)",
        wheat: "var(--color-wheat)",
        clay: "var(--color-clay)",
        horizonTop: "var(--color-horizon-top)",
        horizonMid: "var(--color-horizon-mid)",
        horizonLow: "var(--color-horizon-low)",
        line: "var(--color-line)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [],
};
export default config;
