/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        "off-white": "#f5f5f5",
        "light-ivory": "#F6F4F3",
        ivory: "#F4EAE6",
        teal: "#4297A0",
        coral: "#E57F84",
        grey: "#2F5061",
        "light-blue": "#76D3FB",
        "dark-blue": "#3F5896",
        "dark-grey": "#2E2E2E",
        mustard: "#FFCC66",
        "pres-coral": "#FA8068",
      },
    },
  },
  plugins: [],
};
