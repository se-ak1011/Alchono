/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#151718',
        surface: '#1D2023',
        'surface-2': '#242729',
        'text-primary': '#F6F5F2',
        'text-secondary': '#B8BCC3',
        'text-muted': '#5E6472',
        accent: '#B77A33',
        'accent-light': '#D4973F',
        'accent-dark': '#8A5A24',
        danger: '#C0392B',
        'danger-light': '#E74C3C',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
