/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#1a120b',
          900: '#1e1510',
          800: '#231a12',
          700: '#2a1f14',
          600: '#3d2a1a',
          500: '#5c3d2e',
        },
        gold: {
          400: '#e8c97e',
          300: '#c9a87c',
          200: '#d4b896',
        },
        cream: {
          100: '#f5ede6',
          200: '#e8d5c0',
          300: '#d4c0a8',
        },
        rose: {
          300: '#d4a5a5',
          200: '#e8c4c4',
        },
        muted: '#8a7060',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Instrument Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}