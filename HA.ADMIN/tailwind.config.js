/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf6f0',
          100: '#f5ebdb',
          200: '#ead4b3',
          300: '#dcb585',
          400: '#cc9259',
          500: '#c07a3e',
          600: '#a85f31',
          700: '#874629',
          800: '#6d3a28',
          900: '#5a3225',
          950: '#321a12',
        },
        gold: {
          50: '#fdfaef',
          100: '#faf2d4',
          200: '#f4e3a8',
          300: '#edce72',
          400: '#e7b84b',
          500: '#d99d2b',
          600: '#bd7a20',
          700: '#97571e',
          800: '#7c461f',
          900: '#683c1d',
          950: '#3c1f0d',
        },
        cream: {
          50: '#fdfcf8',
          100: '#faf6ed',
          200: '#f4ecd5',
          300: '#ecdcb6',
          400: '#e1c68f',
          500: '#d9b06e',
        },
        brown: {
          50: '#f9f6f3',
          100: '#f0e9e2',
          200: '#e0d1c3',
          300: '#cab09c',
          400: '#b08870',
          500: '#9a6d54',
          600: '#7e5742',
          700: '#654536',
          800: '#4e382c',
          900: '#3a2a21',
          950: '#261812',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px 0 rgba(0,0,0,0.10), 0 2px 6px 0 rgba(0,0,0,0.06)',
        sidebar: '4px 0 24px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
