/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#6D4AFF", dark: "#5A37F0", soft: "#EEEAFF" },
        ink: { DEFAULT: "#16151D", soft: "#5B5A6B", mute: "#9A99A8" },
        line: "#E7E6EE",
        paper: "#F7F7FA",
      },
    },
  },
  plugins: [],
};
