/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1e4d92',
          light: '#2a5ca8',
          dark: '#183e77',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp')
  ],
  mode: 'jit',
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
}

