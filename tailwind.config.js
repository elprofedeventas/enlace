/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="oscuro"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        // Identidad ENLACE: rosa/granate elegante (boda).
        enlace: {
          50: '#fff1f4',
          100: '#ffe0e7',
          200: '#ffc6d4',
          300: '#ff9bb4',
          400: '#fb6189',
          500: '#f13063',
          600: '#de1450',
          700: '#bb0c43',
          800: '#9c0d3f',
          900: '#85103b',
          950: '#4a031c',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
};
