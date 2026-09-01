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
          900: "#0A120D", // dark-mode screen background — deep green-black, not flat black
          500: "#6B7169",
          100: "#F4F5F3",
        },
        // Dark mode card surface (applied via `dark:bg-surface-dark`) — a
        // visible step lighter than neutral-900 so cards actually read as
        // raised against the background, per feedback that dark mode was
        // "too dark" and components weren't visible (surface-dark used to
        // equal neutral-900 exactly, i.e. zero contrast between the two).
        "surface-dark": "#15251C",
      },
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular"],
        medium: ["PlusJakartaSans_500Medium"],
        semibold: ["PlusJakartaSans_600SemiBold"],
        bold: ["PlusJakartaSans_700Bold"],
        extrabold: ["PlusJakartaSans_800ExtraBold"],
      },
      // Text was reading too small across the app - the whole scale is
      // bumped ~12.5% over Tailwind's RN defaults (e.g. text-sm 14->16,
      // text-base 16->18) so every existing `text-*` class picks this up
      // automatically instead of editing every call site individually.
      // Mirrors the equivalent root font-size bump on web.
      fontSize: {
        xs: ["13px", { lineHeight: "17px" }],
        sm: ["16px", { lineHeight: "21px" }],
        base: ["18px", { lineHeight: "26px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["22px", { lineHeight: "29px" }],
        "2xl": ["27px", { lineHeight: "33px" }],
        "3xl": ["34px", { lineHeight: "38px" }],
        "4xl": ["40px", { lineHeight: "44px" }],
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
