/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        brand: { DEFAULT: "#7C5CFC", dark: "#6643F0", soft: "#F1EDFF", ring: "#C9BBFF" },
        navy: { DEFAULT: "#1B1838", soft: "#2A2650" },
        ink: { DEFAULT: "#1B1838", soft: "#5E5B78", mute: "#9C99B3" },
        line: "#ECEAF4",
        paper: "#F7F6FB",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(27,24,56,.04), 0 4px 16px rgba(27,24,56,.06)",
        float: "0 12px 40px rgba(27,24,56,.14)",
      },
      borderRadius: { "2xl": "1.1rem", "3xl": "1.5rem" },
    },
  },
  plugins: [],
};
