# Theme — Premium Near-Black Purple (v1)

Alchono should read as **black at a glance**, then slowly reveal an extremely
dark, muted violet undertone. The feeling is **expensive, not colourful** —
luxury editorial (Leica, Linear, Notion, Apple Music dark, expensive whisky
packaging). Never neon, gaming RGB, cyberpunk, or obvious gradients.

## Palette (single source of truth: `tailwind.config.js`)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#15141A` | Background — black with a violet whisper |
| `surface` | `#211E29` | Cards — a hair lifted for natural depth |
| `surface-2` | `#272330` | Secondary cards / inputs |
| `text-primary` | `#F3F0F4` | Titles + the one line that matters (warm off-white) |
| `text-secondary` | `#BDB6C5` | Reading text (violet-grey) |
| `text-muted` | `#8E8798` | Meta, hints, anything skippable |
| `accent` | `#9B82D0` | Muted dusty mauve — complements the bg, never bright purple |
| `accent-dark` | `#B197E4` | Pressed / hover accent |
| `divider` | `rgba(243, 240, 244, 0.10)` | Hairline dividers |
| `hairline` | `rgba(243, 240, 244, 0.10)` | Borders |
| `urge` / `urge-surface` | `#33283F` / `#272330` | The crisis tint (unchanged) |

## Depth (not flatness, not texture)

`src/components/ui/Depth.tsx` renders behind every `SafeArea` screen (opt out
with `<SafeArea depth={false}>` for full-bleed screens like the constellation):

- **Vertical tonal lift** — a barely-there gradient, a touch warmer/lighter
  violet at the top settling into the base near-black by the bottom.
- **Microscopic vignette** — invisible through the centre, a soft darkening at
  the very edges to draw the eye inward.
- **Noise (planned)** — 1–2% monochromatic film grain via a tiled PNG asset
  (omitted for now rather than faked with an unreliable runtime filter).

The interface should feel **layered without looking textured**.

## Glow → contrast

The premium look relies on **contrast, not glow**. Large headings are crisp
(`headingShadow` carries no shadow — just warm-white + bold).

A soft muted-violet halo (`celebrationGlow` in `src/styles`) is reserved for the
few moments that should feel luminous:

- streaks
- milestone celebrations
- emergency actions
- success beats (an urge ridden out, a day marked)

Everywhere else stays crisp.
