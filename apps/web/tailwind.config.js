/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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
      fontFamily: {
        display: ["var(--mos-font-display)"],
        body: ["var(--mos-font-body)"],
      },
    },
  },
  plugins: [],
};
