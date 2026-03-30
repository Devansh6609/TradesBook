import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--primary) / <alpha-value>)",
        background: {
          DEFAULT: "rgb(var(--background) / <alpha-value>)",
          secondary: "rgb(var(--background-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--background-tertiary) / <alpha-value>)",
        },
        foreground: {
          DEFAULT: "rgb(var(--foreground) / <alpha-value>)",
          muted: "rgb(var(--foreground-muted) / <alpha-value>)",
          disabled: "rgb(var(--foreground-disabled) / <alpha-value>)",
        },
        profit: {
          DEFAULT: "rgb(var(--profit) / <alpha-value>)",
          light: "rgb(var(--profit-light) / <alpha-value>)",
          dark: "rgb(var(--profit-dark) / <alpha-value>)",
        },
        loss: {
          DEFAULT: "rgb(var(--loss) / <alpha-value>)",
          light: "rgb(var(--loss-light) / <alpha-value>)",
          dark: "rgb(var(--loss-dark) / <alpha-value>)",
        },
        chart: {
          line: "rgb(var(--primary) / <alpha-value>)",
          fill: "rgb(var(--primary) / 0.1)",
          grid: "rgb(var(--border) / <alpha-value>)",
          up: "rgb(var(--profit) / <alpha-value>)",
          down: "rgb(var(--loss) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          hover: "rgb(var(--border-hover) / <alpha-value>)",
        },
        card: "var(--card-bg)",
        input: "rgb(var(--input-bg) / <alpha-value>)",
        header: "rgb(var(--header-bg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
