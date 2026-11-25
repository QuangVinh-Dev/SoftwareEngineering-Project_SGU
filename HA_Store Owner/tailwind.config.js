/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f8f9',
          100: '#d9eef1',
          200: '#b5dee4',
          300: '#84c5cf',
          400: '#4da4b4',
          500: '#328899',
          600: '#286b7b', // Theme Teal
          700: '#205764',
          800: '#1a4752',
          900: '#163a43',
          950: '#0d2228',
          DEFAULT: '#286b7b',
        },
        navy: {
          50: '#f0f5fa',
          100: '#e0ebf4',
          200: '#bed7e9',
          300: '#8ebbd7',
          400: '#5698c1',
          500: '#347aa9',
          600: '#26628d',
          700: '#1f4f72',
          800: '#183a54', // Theme Deep Navy
          900: '#142e44',
          950: '#0d1e2d',
          DEFAULT: '#183a54',
        },
        teal: {
          50: '#f0f8f9',
          100: '#d9eef1',
          200: '#b5dee4',
          300: '#84c5cf',
          400: '#4da4b4',
          500: '#328899',
          600: '#286b7b',
          700: '#205764',
          800: '#1a4752',
          900: '#163a43',
          DEFAULT: '#286b7b',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
