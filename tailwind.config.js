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
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          muted: '#94a3b8',
        },
        // Warm household theme — Scandinavian, calm, family-oriented
        warm: {
          // Light mode
          bg: '#F7F4EE',
          card: '#FFFDFC',
          surface: '#F0ECE4',
          text: '#2E2A25',
          muted: '#766F66',
          sage: '#6E8B74',
          terracotta: '#C98B6A',
          gold: '#C7A86B',
          // Dark mode
          'dark-bg': '#23211D',
          'dark-card': '#2D2A26',
          'dark-surface': '#38342F',
          'dark-text': '#F4F0EA',
          'dark-muted': '#B7AEA2',
          'dark-sage': '#89A48E',
          'dark-terracotta': '#D59B7B',
          'dark-gold': '#D4B97C',
        }
      },
      borderRadius: {
        'warm-sm': '14px',
        'warm': '20px',
        'warm-lg': '24px',
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(110, 90, 60, 0.08), 0 2px 8px -2px rgba(110, 90, 60, 0.06)',
        'warm-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.25), 0 2px 8px -2px rgba(0, 0, 0, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      }
    },
  },
  plugins: [],
}
