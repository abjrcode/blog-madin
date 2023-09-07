/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./blog/templates/*.html"],
  darkMode: "class",
  theme: {
    debugScreens: {
      prefix: "dbg-screen: ",
      position: ["bottom", "right"],
    },
    extend: {},
  },
  plugins: [require("tailwindcss-debug-screens")],
};
