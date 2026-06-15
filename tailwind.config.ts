import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        studio: {
          ink: "#05070b",
          panel: "#0c1018",
          panel2: "#121826",
          line: "#263244",
          cyan: "#5eead4",
          mint: "#86efac",
          amber: "#fbbf24",
          coral: "#fb7185",
          blue: "#60a5fa"
        }
      },
      boxShadow: {
        glow: "0 0 32px rgba(94, 234, 212, 0.18)",
        pad: "inset 0 1px 0 rgba(255,255,255,0.09), 0 18px 32px rgba(0,0,0,0.28)"
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
