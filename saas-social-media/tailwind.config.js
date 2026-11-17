/** @type {import('tailwindcss').Config} */
// Identidade Post Lover: cobalto (principal), creme, coral (destaque), amarelo manteiga, carvão
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["'Bricolage Grotesque'", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: { DEFAULT: "#082B87", dark: "#061F63", soft: "#E7ECFA", ring: "#A8B8E8", light: "#1E4FD8" },
        navy: { DEFAULT: "#082B87", soft: "#0B37A8" },
        coral: { DEFAULT: "#FF573C", dark: "#E8452B", soft: "#FFE4DE" },
        butter: { DEFAULT: "#F8D85C", soft: "#FDF3CC" },
        cream: "#FFF4E1",
        ink: { DEFAULT: "#242329", soft: "#56545F", mute: "#9C98A2" },
        line: "#EFE2CB",
        paper: "#FFF4E1",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(36,35,41,.04), 0 4px 16px rgba(8,43,135,.06)",
        float: "0 12px 40px rgba(8,43,135,.16)",
        sticker: "3px 3px 0 0 #082B87",
      },
      borderRadius: { "2xl": "1.1rem", "3xl": "1.5rem" },
    },
  },
  plugins: [],
};
