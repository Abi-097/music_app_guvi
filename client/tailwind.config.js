/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        ink: { 900: '#0b0b12', 800: '#12121c', 700: '#1a1a28', 600: '#25253a' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
