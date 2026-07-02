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
        bg: '#0E0F10',
        surface: '#161718',
        'surface-2': '#1E2022',
        'text-primary': '#F0F2F4',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
        accent: '#C4C9D0',
        'accent-dark': '#A8B0BA',
        danger: '#C0392B',
        'danger-light': '#E74C3C',
        // The devil's tint — matches the purple in the app icon. Used as a
        // near-subliminal cast over urge-flow surfaces.
        urge: '#120D17',
        'urge-surface': '#17121E',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
      },
      borderRadius: {
        '2xl': '8px',
        '3xl': '12px',
      },
    },
  },
  plugins: [],
};
