import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palet TransJakarta
        tj: {
          blue: "#093FB4",
          blueDark: "#062B7D",
          blueSoft: "#E8EEFB",
          white: "#FFFCFB",
          orange: "#ED3500",
          ink: "#0C1633",
          muted: "#5A6480",
          rule: "#E2E6F0",
        },
        // Warna per kategori review
        label: {
          apresiasi: "#093FB4",
          keluhan: "#ED3500",
          saran: "#0B8A6A",
          pertanyaan: "#7A5AF8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-barlow)", "var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
