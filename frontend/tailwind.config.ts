/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        oxblood: { 800: '#5C0A0A', 900: '#3D0606', 950: '#1A0303' },
        gold:    { 400: '#E8C96A', 500: '#C9A84C', 600: '#A88530' },
      },
    },
  },
  plugins: [],
}
