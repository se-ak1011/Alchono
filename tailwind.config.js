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
        // Dark charcoal-plum system: airy, readable, emotionally serious,
        // and still unmistakably Alchono (see docs/theme.md).
        bg: '#15141A',            // app background — early-morning charcoal plum
        surface: '#211E29',       // primary cards — lifted but not glossy
        'surface-2': '#272330',   // secondary cards / inputs
        'text-primary': '#F3F0F4', // warm off-white
        'text-secondary': '#BDB6C5', // reading text, violet-grey
        'text-muted': '#8E8798',  // meta / hints, violet-grey
        // Luminous but understated purple accent. Use it to guide attention,
        // not flood the interface.
        accent: '#9B82D0',
        'accent-dark': '#B197E4',
        danger: '#C98282',
        'danger-light': '#C98282',
        // Subtle warm-lavender hairlines for separation without harsh white.
        divider: 'rgba(243, 240, 244, 0.10)',
        hairline: 'rgba(243, 240, 244, 0.10)',
        // Deep purple tint reserved for urge-flow emphasis.
        urge: '#33283F',
        'urge-surface': '#272330',
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
