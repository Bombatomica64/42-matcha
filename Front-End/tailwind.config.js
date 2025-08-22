/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--p-primary-color)',
        'primary-contrast': 'var(--p-primary-contrast-color)',
        surface: 'var(--p-surface-200)' // opzionale
      },
      borderColor: {
        primary: 'var(--p-primary-color)'
      }
    }
  },
  plugins: [],
}