/** @type {import('tailwindcss').Config} */
const forms = require("@tailwindcss/forms")

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbdbed",
          300: "#f9bddf",
          400: "#f79dc6",
          500: "#f57eb8",
          600: "#f35f9f",
          700: "#f04186",
          800: "#ee236d",
          900: "#ec0554",
        },
      },
    },
  },
  plugins: [forms],
}
