/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta do space mais (azul Contattos+ como cor de marca)
        brand: { DEFAULT: "#0038FF", dark: "#002AD1", soft: "#E8EEFF" },
        ink: { DEFAULT: "#0A0E1A", 2: "#4A4E5C" },
        muted: "#8A8DA0",
        line: "#E6E8EE",
        hover: "#F2F3F6",
        canvas: "#F7F8FA",
      },
      boxShadow: {
        pop: "0 12px 32px -8px rgba(10,14,26,.18), 0 2px 6px rgba(10,14,26,.06)",
        card: "0 1px 2px rgba(10,14,26,.05)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
