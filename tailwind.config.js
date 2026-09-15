/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidade visual Contattos+ (logo laranja/vermelho com raio).
        brand: {
          amber: "#FBAE17",
          orange: "#F7941D",
          red: "#ED1C24",
          redDark: "#B5121B",
        },
      },
    },
  },
  plugins: [],
};
