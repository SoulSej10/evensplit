/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // EvenSplit brand tokens — PROJECT_PLAN.md §3.2
      colors: {
        primary: {
          DEFAULT: "#2F6F5E",
          light: "#E4F2EE",
        },
        positive: "#2E9E6B",
        negative: "#D95F5F",
        warning: "#E0A63A",
        surface: "#FFFFFF",
        neutral: {
          900: "#1A1D1B",
          500: "#6B7169",
          100: "#F4F5F3",
        },
        // Dark mode surfaces (applied via `dark:` variants)
        "surface-dark": "#22271F",
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
