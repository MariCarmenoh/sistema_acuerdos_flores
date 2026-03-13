/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        muni: {
          50:  '#e8eef8',
          100: '#c5d3ee',
          200: '#9eb6e3',
          700: '#003DA5',
          800: '#002d7a',
          900: '#001e52',
        },
        escudo: {
          rojo:     '#C8102E',
          dorado:   '#C9A84C',
          amarillo: '#F5C518',
        },
      },
      boxShadow: {
        card:   '0 1px 3px 0 rgb(0 0 0 / 0.08)',
        modal:  '0 20px 60px -10px rgb(0 0 0 / 0.3)',
        navbar: '0 2px 8px 0 rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}
