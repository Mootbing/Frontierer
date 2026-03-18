/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        frontier: {
          green: '#00853e',
          light: '#e6f4ec',
          dark: '#005c2b',
        },
      },
    },
  },
  plugins: [],
}
