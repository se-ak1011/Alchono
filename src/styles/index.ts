// The Display treatment — reserved for a screen's ONE hero title (see
// docs/type-hierarchy.md). Pure white + full bold + a *whisper* of glow so it
// lifts off the near-black background without shouting. Softened from the old
// values (0.30 opacity / 14 radius) because it was over-applied to ~80
// elements; a quieter glow lets a single anchor read per screen.
export const headingShadow = {
  color: '#FFFFFF',
  fontFamily: 'Inter_700Bold',
  textShadowColor: 'rgba(240, 242, 244, 0.16)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 9,
};
