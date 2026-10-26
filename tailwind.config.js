/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d0f12',
          surface: '#161922',
          border: '#272b36',
        },
      },
    },
  },
  plugins: [],
};
