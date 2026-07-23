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
        bg: '#201D28',            // app background — deep plum charcoal (base layer)
        surface: '#383243',       // primary cards — clearly raised off the bg
        'surface-2': '#474151',   // secondary cards / inputs — highest layer
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
        divider: 'rgba(236, 233, 241, 0.13)',
        hairline: 'rgba(236, 233, 241, 0.13)',
        // Deep purple tint reserved for urge-flow emphasis.
        urge: '#3B3352',
        'urge-surface': '#413B50',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
        // The handwritten display face — identity only (monograms, the urge
        // pill, anywhere we want the wordmark's character).
        display: ['SkinnyCustard'],
      },
      borderRadius: {
        '2xl': '8px',
        '3xl': '12px',
      },
    },
  },
  plugins: [],
};
