# Type Hierarchy (v1)

A calm, consistent reading order for Alchono, built only from **black, grey,
white, and size** — no new colour, no more purple. The goal: on any screen the
eye lands on one thing first, then flows down. If everything is emphasised,
nothing is.

## The palette (unchanged)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0E0F10` | app background |
| `surface` | `#161718` | cards |
| `surface-2` | `#1E2022` | insets, chips |
| `text-primary` | `#F0F2F4` | titles, the one thing that matters |
| `text-secondary` | `#9CA3AF` | body / reading text |
| `text-muted` | `#6B7280` | meta, hints, anything skippable |

## The six roles

| Role | Size | Weight | Colour | Notes |
|---|---|---|---|---|
| **Display** | 26–30 | bold | white + *subtle* glow | The screen's hero title. **One per screen.** Nothing else glows. |
| **Section title** | 18–20 | semibold | primary | Card / group heading. No glow. |
| **Item title** | 16 | medium–semibold | primary | A row or card's main line. |
| **Body** | 15–16 | **regular** | **secondary (grey)** | Reading text. Not white, not semibold. |
| **Eyebrow** | 12 | medium | muted | Uppercase section marker, `tracking-widest`. |
| **Meta** | 12–13 | regular | muted | Timestamps, counts, hints, disclaimers. |

## The five rules

1. **One glow per screen.** Only the Display title carries `headingShadow`.
   Card and section titles use weight + size, never the glow.
2. **Bold is rare.** Reserve bold for the Display title and the single most
   important number/word on a screen. Section titles are semibold; everything
   else is medium or regular.
3. **Body is grey, not white.** `text-secondary` for reading text.
   `text-primary` (white) is only for titles and the one line that matters most.
4. **Tone first, size second, weight last.** Reach for a dimmer grey before a
   bigger size, and a bigger size before a heavier weight.
5. **Muted for anything the eye can skip.** Meta, hints, and disclaimers live
   at `text-muted` — present, never competing.

## Applying it

- The glow (`headingShadow` in `src/styles`) has been softened so even where
  it's currently over-applied, it whispers instead of shouts. As screens are
  revised, strip it from everything that isn't the Display title.
- Roll out per screen area (home, insights, support, profile, sessions),
  little and often — collapse over-emphasised body copy to grey/regular, keep
  one clear anchor per screen.
