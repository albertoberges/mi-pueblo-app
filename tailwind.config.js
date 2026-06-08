/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a5276",
          50: "#eaf2f8",
          100: "#d5e8f5",
          200: "#aad1eb",
          300: "#7fbae1",
          400: "#54a3d7",
          500: "#298ccd",
          600: "#1e6fa4",
          700: "#1a5276",
          800: "#153f5c",
          900: "#0e2c41",
        },
        secondary: {
          DEFAULT: "#e67e22",
          light: "#f0a04b",
          dark: "#ca6f1e",
        },
        success: "#27ae60",
        warning: "#f39c12",
        danger: "#e74c3c",
        surface: "#f8f9fa",
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
