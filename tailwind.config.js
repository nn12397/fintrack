/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF6FF',
          100: '#D8EBFF',
          200: '#B8DBFF',
          300: '#8AC5FF',
          400: '#5BA9FF',
          500: '#2B88FF',
          600: '#0A66E5',
          700: '#0850B5',
          800: '#0A3D85',
          900: '#0C325C',
          950: '#081F3C',
        },
        secondary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        accent: {
          50: '#FFF4ED',
          100: '#FFE9DB',
          200: '#FFD3B6',
          300: '#FFB992',
          400: '#FF9E6D',
          500: '#FF8449',
          600: '#FF6A24',
          700: '#FF5000',
          800: '#CC4000',
          900: '#993000',
          950: '#661F00',
        },
      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};