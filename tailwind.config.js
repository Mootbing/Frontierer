/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        frontier: {
          green: '#00853e',
          light: '#e6f4ec',
          dark: '#005c2b',
        },
        noir: {
          bg:      '#0a0a0a',
          surface: '#111111',
          raised:  '#1a1a1a',
          border:  '#2a2a2a',
          text:    '#f0f0f0',
          muted:   '#707070',
          green:   '#00853e',
          'green-dim': '#006b32',
        },
      },
      boxShadow: {
        'glow-green': '0 0 0 2px #00853e, 0 0 12px rgba(0,133,62,0.5)',
      },
    },
  },
  plugins: [],
}
