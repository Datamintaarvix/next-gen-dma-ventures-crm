import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F3F8F7",
        foreground: "#11232B",
        sidebar: {
          DEFAULT: "#192C34",
          foreground: "#E0EBE9",
          muted: "#8A9EA5",
          border: "#243B45",
          accent: "#078783",
        },
        primary: {
          DEFAULT: "#078783",
          hover: "#056E6B",
          light: "#E6F5F4",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#11232B",
        },
        border: "#E2ECEB",
        muted: {
          DEFAULT: "#F3F8F7",
          foreground: "#5A7178",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
