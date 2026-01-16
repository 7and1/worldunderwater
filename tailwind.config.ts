import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Ocean - Primary
        ocean: {
          900: "#0a1628",
          800: "#0f2137",
          700: "#152d4a",
          600: "#1a3a5c",
          500: "#1f476e",
        },
        // Abyss - Backgrounds
        abyss: {
          950: "#030810",
          900: "#060d1a",
          850: "#081224",
        },
        // Surface Waters - Accents
        surface: {
          400: "#38bdf8",
          300: "#7dd3fc",
          200: "#bae6fd",
        },
        // Coral - Warning/Danger
        coral: {
          600: "#dc2626",
          500: "#ef4444",
          400: "#f87171",
        },
        // Foam - Text
        foam: {
          100: "#f0f9ff",
          200: "#e0f2fe",
          300: "#bae6fd",
          400: "#7dd3fc",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-emergency": "pulse-emergency 2s ease-in-out infinite",
        "pulse-catastrophic": "pulse-catastrophic 1.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-emergency": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "pulse-catastrophic": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 0 0 rgba(147, 51, 234, 0.4)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 20px 4px rgba(147, 51, 234, 0.2)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
