// The Display treatment — a screen's hero title. In the premium theme the
// look relies on CONTRAST, not glow: warm off-white on near-black violet,
// fully bold, crisp. No shadow (see docs/theme.md).
export const headingShadow = {
  color: '#F3F0F4',
  fontFamily: 'Inter_700Bold',
};

// Reserved for the few moments that should feel luminous: streaks, milestone
// celebrations, emergency actions, and success beats (an urge ridden out, a
// day marked). A soft muted-violet halo — never neon, just a quiet lift.
export const celebrationGlow = {
  color: '#F3F0F4',
  fontFamily: 'Inter_700Bold',
  textShadowColor: 'rgba(167, 159, 178, 0.22)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 12,
};
