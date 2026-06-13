import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#0a0a0f",
          panel: "#111118",
          raised: "#16161f",
        },
        border: {
          subtle: "#1f1f2b",
          strong: "#2a2a38",
        },
        text: {
          primary: "#e6e6f0",
          muted: "#8a8a99",
          dim: "#5a5a68",
        },
        accent: {
          cyan: "#22d3ee",
          magenta: "#f0abfc",
          violet: "#a78bfa",
          rose: "#fb7185",
        },
        risk: {
          low: "#22d3ee",
          medium: "#a78bfa",
          high: "#f0abfc",
          critical: "#fb7185",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        "glow-cyan": "0 0 0 1px rgba(34, 211, 238, 0.4), 0 0 12px rgba(34, 211, 238, 0.15)",
        "glow-magenta": "0 0 0 1px rgba(240, 171, 252, 0.4), 0 0 12px rgba(240, 171, 252, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
