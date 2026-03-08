/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
      },
      colors: {
        arena: {
          bg: '#0D1B2A',
          panel: '#132238',
          accent: '#FF9F1C',
          success: '#2EC4B6',
          danger: '#E71D36',
          text: '#E0E9F4',
        },
      },
      boxShadow: {
        neon: '0 0 40px rgba(255, 159, 28, 0.25)',
      },
    },
  },
  plugins: [],
};
