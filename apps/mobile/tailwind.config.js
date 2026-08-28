/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // SplitEven brand tokens v7 — reverted off the plum/indigo retheme
      // back to the original teal-green brand per direct feedback ("go back
      // on the green theme"). The amber accent and positive/negative/
      // warning semantics introduced alongside personal budgeting stay as
      // they are — those weren't the brand-chrome complaint.
      colors: {
        primary: {
          DEFAULT: "#16A88F",
          light: "#E3FBF6",
          bright: "#35D6B5", // for dark-mode text/icons on the dark bg
          soft: "#63E7CE",
          deep: "#0F7A68", // for gradients / pressed states
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
          900: "#0A0A0A",
          500: "#6B7169",
          100: "#F4F5F3",
        },
        // Dark mode surfaces (applied via `dark:` variants) — dark mode is
        // now the default (see app/_layout.tsx), so this is the brand's
        // true near-black, not a tinted variant.
        "surface-dark": "#0A0A0A",
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
