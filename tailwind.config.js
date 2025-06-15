/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e6ede5',
          200: '#cfdccb',
          300: '#aec3a9',
          400: '#89a782',
          500: '#688b61',
          600: '#507049',
          700: '#415a3c',
          800: '#374a34',
          900: '#313f2f',
          950: '#172111',
        },
        terracotta: {
          50: '#fcf5f2',
          100: '#f8e8e1',
          200: '#f2d1c3',
          300: '#e9b198',
          400: '#df886a',
          500: '#d56a47',
          600: '#c7553d',
          700: '#a43f33',
          800: '#85352f',
          900: '#6c2f28',
          950: '#3a1612',
        },
      }
    },
  },
  plugins: [],
  darkMode: 'class',
};