/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'], 
      },
      colors: {
        emerald: {
          700: '#047857',
        },
        gold: {
          600: '#785704',
        }
      }
    },
  },
  plugins: [],
}