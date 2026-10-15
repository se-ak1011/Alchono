# Arcade games

Self-contained single-page HTML games for the Alchono arcade. Each file is one
`.html` page with everything inline (no build step, no dependencies), so it can
be loaded straight into a `WebView` inside its cabinet in the arcade room.

These replace the generic arcade mini-games with purpose-built, Alchono-native
ones — all drawn from the world's own language (the skull-plant, the darkness/
smoke as the craving, quiet growth, a calm haven). Period-accurate to the
1998–2003 era of the room.

## The games

| File | Device (era) | What it is |
|------|--------------|------------|
| `skull-defense-1.html` | Arcade cabinet | Fast-paced shooter — defend your growing skull-plant from the darkness |
| `skull-defense-2.html` | Arcade cabinet | Second fast-paced shooter, same world |
| `growth-journey.html` | Game Boy | A gentle journey of quiet growth and self-care |
| `haven-builder.html` | PS1/PS2 | A calm haven-builder — nurture your own peaceful space over time |

(Filenames are placeholders — rename to whatever fits once the finals land.)

## Status

Pasted in by Marta, pending the arcade-room art going live. Once the cabinets
are drawn, each game gets a hotspot in the arcade node that opens its HTML in a
WebView (a cabinet "screen"). Until then they live here for preview/testing.
