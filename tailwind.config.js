/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'spotify-green': '#1DB954',
        'spotify-black': '#191414',
        'spotify-dark': '#121212',
        'spotify-gray': '#535353',
        'spotify-lightgray': '#B3B3B3',
      },
      fontFamily: {
        'spotify': ['Circular', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
