/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // SplitEven brand tokens — PROJECT_PLAN.md §3.2
      colors: {
        primary: {
          DEFAULT: "#16A88F",
          light: "#E3FBF6",
          bright: "#35D6B5",
          soft: "#63E7CE",
        },
        positive: "#2E9E6B",
        negative: "#D95F5F",
        warning: "#E0A63A",
        surface: "#FFFFFF",
        neutral: {
          900: "#0A0A0A",
          500: "#6B7169",
          100: "#F4F5F3",
        },
        // Dark mode surfaces (applied via `dark:` variants)
        "surface-dark": "#0A0A0A",
      },
      fontFamily: {
        sans: ["Poppins_400Regular"],
        medium: ["Poppins_500Medium"],
        semibold: ["Poppins_600SemiBold"],
        bold: ["Poppins_700Bold"],
      },
      borderRadius: {
        card: "14px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
