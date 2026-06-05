/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'univers': ['"Univers 67"', 'sans-serif'],
        'futura': ['"Futura Bold"', 'sans-serif']
      },
      colors: {
        brand: {
          purple: '#7c3aed',
          orange: '#f97316'
        }
      }
    }
  },
  plugins: []
}