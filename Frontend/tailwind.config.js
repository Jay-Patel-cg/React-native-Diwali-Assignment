/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './hooks/**/*.{js,jsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#0B4F6C',
          900: '#083344',
          950: '#04202C',
        },
        seafoam: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',
        },
        sand: {
          50: '#FDFBF7',
          100: '#F8F4EC',
          200: '#EFE7D8',
          300: '#DFD2BC',
        },
        coral: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          400: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};

