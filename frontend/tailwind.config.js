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
        'agic-dark': '#121320',
        'agic-card': '#1a1b2e',
        'agic-border': 'rgba(255,255,255,0.08)',
        'agic-primary': '#DC0278',
        'agic-secondary': '#EB5E2D',
        primary: {
          50: 'rgba(220,2,120,0.08)',
          100: 'rgba(220,2,120,0.14)',
          300: 'rgba(220,2,120,0.5)',
          500: '#DC0278',
          600: '#DC0278',
          700: '#b8006a',
        },
      },
      backgroundImage: {
        'gradient-agic': 'linear-gradient(135deg, #DC0278 0%, #EB5E2D 100%)',
        'gradient-agic-text': 'linear-gradient(90deg, #DC0278 0%, #EB5E2D 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
