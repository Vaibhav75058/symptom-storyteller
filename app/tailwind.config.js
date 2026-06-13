/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#534AB7",
        success: "#1D9E75",
        warning: "#BA7517",
        danger: "#A32D2D",
        bgLight: "#FFFFFF",
        surfaceLight: "#F7F6F3",
        bgDark: "#141413",
        surfaceDark: "#1E1E1C",
        textLight: "#1A1A18",
        textDark: "#F0EFE8",
      },
      fontFamily: {
        poppins: ["Poppins_400Regular", "Poppins_600SemiBold", "Poppins_700Bold"],
        dmSans: ["DMSans_400Regular", "DMSans_500Medium"],
      }
    },
  },
  plugins: [],
}
