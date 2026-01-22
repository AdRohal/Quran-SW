module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#000000",
        border: "#e5e7eb",
        primary: {
          DEFAULT: "#0d766e",
          light: "#14918a",
          dark: "#0a5c57",
        },
        secondary: {
          DEFAULT: "#8b5cf6",
          light: "#a78bfa",
          dark: "#7c3aed",
        },
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
