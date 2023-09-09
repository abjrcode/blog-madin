const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./blog/templates/*.html"],
  darkMode: "class",
  theme: {
    fontFamily: {
      sans: ["Lato", "Roboto", ...defaultTheme.fontFamily.sans],
      mono: ['"Fira Code"', ...defaultTheme.fontFamily.mono],
    },
    debugScreens: {
      prefix: "dbg-screen: ",
      position: ["bottom", "right"],
    },
    extend: {},
  },
  plugins: [require("tailwindcss-debug-screens")],
};
