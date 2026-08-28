/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // SplitEven brand tokens v6 — full retheme per direct feedback ("done
      // with the generic white+green look"). Brand chrome moves to a deep
      // plum/indigo with a warm amber accent, on warm ivory (light) / warm
      // charcoal-plum (dark) surfaces instead of teal-on-white. Money
      // semantics are untouched on purpose: positive/negative/warning stay
      // emerald/coral/amber regardless of brand color, so "green" keeps
      // meaning "you're owed / gained money," never "this is a button."
      colors: {
        primary: {
          DEFAULT: "#5B3A8E", // deep plum-indigo
          light: "#EDE5F7", // pale lavender tint
          bright: "#9B7FD4", // for dark-mode text/icons on the dark bg
          soft: "#C9B8E8",
          deep: "#3E2766", // for gradients / pressed states
        },
        accent: {
          DEFAULT: "#F5A524", // warm amber - CTAs, streaks, highlights
          light: "#FDF1DC",
          deep: "#B9790F",
        },
        positive: "#009B87", // emerald - financial gains only, never decorative
        negative: "#D95F5F", // soft coral/red
        warning: "#E0A63A", // warm amber
        surface: "#FFFFFF",
        neutral: {
          900: "#1E1B24", // near-black, plum-tinted text
          500: "#726C7D",
          100: "#F7F5F2", // warm ivory background
        },
        // Dark mode surfaces (applied via `dark:` variants)
        "surface-dark": "#1E1930",
      },
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular"],
        medium: ["PlusJakartaSans_500Medium"],
        semibold: ["PlusJakartaSans_600SemiBold"],
        bold: ["PlusJakartaSans_700Bold"],
        extrabold: ["PlusJakartaSans_800ExtraBold"],
      },
      // v3: less "stadium pill", more geometric edge per feedback - buttons
      // and chips now use a modest rounded-rect instead of a full capsule.
      // Circles (avatars, FABs) are unaffected since those use `rounded-full`
      // directly, not this token.
      // v4: cards were still reading as "over-rounded / generic" per
      // feedback - card radius nudged down again for a semi-soft, more
      // deliberate edge (not fully squared, not a soft blob).
      borderRadius: {
        card: "14px",
        pill: "10px",
      },
    },
  },
  plugins: [],
};
