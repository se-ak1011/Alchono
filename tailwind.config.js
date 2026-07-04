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
        // Premium near-black purple system. Reads as black at a glance, then
        // a barely-perceptible deep violet undertone surfaces. Expensive, not
        // colourful (see docs/theme.md).
        bg: '#09070C',            // background — black with a violet whisper
        surface: '#121017',       // cards — a hair lifted for natural depth
        'surface-2': '#1A1423',   // elevated / active / current-session / streaks
        'text-primary': '#F4F1ED', // warm off-white
        'text-secondary': '#9B98A8', // reading text, violet-grey
        'text-muted': '#666270',  // meta / hints, violet-grey
        // Muted dusty mauve — darker & less saturated so it complements the
        // background instead of standing apart. Never bright purple.
        accent: '#A79FB2',
        'accent-dark': '#8E86A0',
        danger: '#C0392B',
        'danger-light': '#E74C3C',
        // Hairlines (spec: dividers 5%, borders 7%). Tokens for new work;
        // existing border-white/X utilities already sit in this range.
        divider: 'rgba(255,255,255,0.05)',
        hairline: 'rgba(255,255,255,0.07)',
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
