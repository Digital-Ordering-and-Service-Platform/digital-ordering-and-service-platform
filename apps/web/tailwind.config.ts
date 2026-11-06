import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#9d3e0f",
          container: "#bd5627",
          fixed: "#ffdbce",
          dim: "#ffb598",
        },
        buna: {
          DEFAULT: "#33302d",
          mocha: "#6f5954",
        },
        yetsom: {
          DEFAULT: "#006a3b",
          container: "#268451",
        },
        gold: {
          DEFAULT: "#e5a93b",
          text: "#b87e14",
        },
        berbere: "#b83226",
        teff: "#fff8f5",
        kds: {
          surface: "#1e1b19",
          card: "#26211e",
          text: "#ffb598",
        },
        outline: {
          DEFAULT: "#8a7269",
          variant: "#ddc0b6",
        },
        "surface-container": {
          DEFAULT: "#f4ece8",
          lowest: "#ffffff",
          low: "#faf2ee",
          high: "#eee7e3",
          highest: "#e9e1dd",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Noto Sans Ethiopic", "Kefa", "sans-serif"],
        ethiopic: ["Noto Sans Ethiopic", "Kefa", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
