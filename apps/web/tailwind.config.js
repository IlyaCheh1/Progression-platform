/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.css"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-golos-text)", "Golos Text", "Segoe UI", "sans-serif"],
        golos: ["var(--font-golos-text)", "Golos Text", "Segoe UI", "sans-serif"],
        unbounded: ["var(--font-unbounded)", "Unbounded", "Arial Black", "sans-serif"],
        display: ["var(--font-unbounded)", "Unbounded", "Arial Black", "sans-serif"],
        body: ["var(--font-golos-text)", "Golos Text", "Segoe UI", "sans-serif"],
      },
      colors: {
        void: {
          DEFAULT: "var(--void)",
          mid: "var(--void-mid)",
          light: "var(--void-light)",
        },
        magenta: "var(--magenta)",
        violet: "var(--violet)",
        yellow: "var(--yellow)",
        primaryText: "var(--color-primaryText)",
        secondaryText: "var(--color-secondaryText)",
        mainBg: "var(--color-mainBg)",
        "controls-stroke": "var(--color-controlsStroke)",
        "controls-secondary-active": "var(--color-controlsSecondaryActive)",
        mos: {
          bg: "var(--mos-bg)",
          elevated: "var(--mos-bg-elevated)",
          stone: "var(--mos-stone)",
          text: "var(--mos-text)",
          muted: "var(--mos-text-muted)",
          amber: "var(--mos-amber)",
          hot: "var(--mos-amber-hot)",
          line: "var(--mos-line)",
        },
      },
      backgroundImage: {
        "gradient-controls-primary-active":
          "linear-gradient(180deg, #f0c35a 0%, #d4a84b 45%, #b8924a 100%)",
      },
    },
  },
  plugins: [],
};
