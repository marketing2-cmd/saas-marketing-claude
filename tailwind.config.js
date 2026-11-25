/** @type {import('tailwindcss').Config} */
// Cores do SpaceMais vêm de variáveis CSS (src/app/globals.css) no formato
// "R G B", para funcionar com modificadores de opacidade (bg-brand/20 etc.).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v("brand"), dark: v("brand-dark"), soft: "rgb(var(--brand) / 0.14)" },
        ink: { DEFAULT: v("ink"), 2: v("ink-2") },
        muted: v("muted"),
        faint: v("faint"),
        line: { DEFAULT: v("line"), strong: v("line-strong") },
        hover: v("hover"),
        canvas: v("canvas"),
        surface: v("surface"),
      },
      boxShadow: {
        pop: "0 18px 48px -12px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.35)",
        card: "0 1px 2px rgba(0,0,0,.25)",
        glow: "0 0 0 1px rgba(255,106,0,.25), 0 20px 60px -20px rgba(255,106,0,.55)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
