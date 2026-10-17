/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // primary amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        flame: {
          500: '#ff5722',
          600: '#ea580c',
          700: '#c2410c'
        },
        dark: {
          950: '#07090e',
          900: '#0d1117',
          850: '#131924',
          800: '#1b2333',
          700: '#26334a',
          600: '#334462'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-amber': '0 0 20px -2px rgba(245, 158, 11, 0.35)',
        'glow-orange': '0 0 25px -3px rgba(234, 88, 12, 0.4)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)'
      }
    },
  },
  plugins: [],
}
