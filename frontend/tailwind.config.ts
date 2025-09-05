import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.25rem", lg: "2rem" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f4f7ff",
          100: "#e8efff",
          200: "#cddcff",
          300: "#a5c0ff",
          400: "#7196ff",
          500: "#4b76ff",
          600: "#325af3",
          700: "#2847c5",
          800: "#223a9c",
          900: "#1d327c",
        },
      },
      boxShadow: { soft: "0 2px 20px rgba(0,0,0,.06)" },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/aspect-ratio")],
};
export default config;
