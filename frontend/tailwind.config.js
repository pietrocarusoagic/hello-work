/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'agic-primary': '#DC0278',
        'agic-secondary': '#EB5E2D',
        'agic-dark': '#121320',
        'agic-card': '#1C1D30',
        'agic-border': '#252639',
      },
    },
  },
  plugins: [],
}
