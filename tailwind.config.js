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
        // Plum-charcoal system: purple-undertoned charcoal — serious and calm,
        // but lifted and airy, never flat near-black (see docs/theme.md).
        bg: '#2A2733',            // app background — lifted plum charcoal
        surface: '#363040',       // primary cards — clearly raised off the bg
        'surface-2': '#3F3A4A',   // secondary cards / inputs
        'text-primary': '#ECE9F1', // soft lavender-white
        'text-secondary': '#B2ACC0', // reading text, violet-grey
        'text-muted': '#817B91',  // meta / hints, violet-grey
        // Luminous but understated purple accent. Use it to guide attention,
        // not flood the interface.
        accent: '#A489DE',
        'accent-dark': '#B9A4EC',
        danger: '#C98282',
        'danger-light': '#C98282',
        // Subtle lavender hairlines for separation without harsh white.
        divider: 'rgba(236, 233, 241, 0.10)',
        hairline: 'rgba(236, 233, 241, 0.10)',
        // Deep purple tint reserved for urge-flow emphasis.
        urge: '#3B3352',
        'urge-surface': '#3A3448',
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
