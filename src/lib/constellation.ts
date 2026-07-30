// Deterministic procedural star layout for the Recovery Constellation.
//
// The sky is never empty. A full field of stars is placed from the very first
// day — but they begin as faint, unlit points of light. Each alcohol-free day
// lights the next star, bright and warm, so progress reads as the sky slowly
// coming alive rather than as a number climbing. A hard day never dims a star
// that's already lit; it only pauses the next one.
//
// Positions grow outward in a phyllotaxis (golden-angle) spiral seeded by index
// and user id, so every person's sky is unique and — crucially — a given star's
// position depends only on its index, never on the total. Lighting more stars
// (or growing the field) therefore never moves the ones already there.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
const SPACING = 26; // base distance between successive stars

// The sky always shows a lush field with room ahead: at least BASE_STARS, and
// always HEADROOM unlit stars beyond however many days are already lit.
const BASE_STARS = 160;
const HEADROOM = 44;

// A tiny, fast string hash → 32-bit unsigned (FNV-1a).
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic [0,1) from a seed string.
function rand(seed: string): number {
  return (hash(seed) % 100000) / 100000;
}

export interface Star {
  date: string | null; // the alcohol-free day this star marks, or null if unlit
  x: number;
  y: number;
  r: number;
  lit: boolean;
  twinkle: number; // 0..1 per-star seed for gentle size/brightness variation
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

export interface Sky {
  stars: Star[];
  lines: Line[];
  radius: number; // furthest star distance from centre
}

export function buildSky(dates: string[], userSeed: string): Sky {
  const count = dates.length;
  // Enough stars for a full sky today, plus headroom so there's always more to
  // light. Field grows only by appending outer stars — never reflows inner ones.
  const capacity = Math.max(BASE_STARS, count + HEADROOM);

  // A per-user rotation so no two skies align.
  const baseRotation = rand(userSeed + ':rot') * Math.PI * 2;

  const stars: Star[] = [];
  for (let i = 0; i < capacity; i++) {
    const rr = rand(`${userSeed}:${i}`);
    const rr2 = rand(`${i}:${userSeed}`);
    // Phyllotaxis, with a whisper of jitter so it reads organic not mechanical.
    // Position is a pure function of index — lighting/growth never moves it.
    const radius = SPACING * Math.sqrt(i + 0.5) * (0.92 + rr * 0.16);
    const theta = i * GOLDEN_ANGLE + baseRotation + (rr2 - 0.5) * 0.25;
    const lit = i < count;
    stars.push({
      date: lit ? dates[i] : null,
      x: Math.cos(theta) * radius,
      y: Math.sin(theta) * radius,
      r: 1.0 + rr2 * 1.6,
      lit,
      twinkle: rr,
    });
  }

  // Constellation lines weave only the *lit* stars — the earned constellation
  // emerging out of the quiet background field. Each lit star joins its nearest
  // earlier lit neighbour when close enough.
  const lit = stars.filter((s) => s.lit);
  const lines: Line[] = [];
  const THRESHOLD = SPACING * 1.7;
  for (let i = 1; i < lit.length; i++) {
    let best = -1;
    let bestD = Infinity;
    for (let j = Math.max(0, i - 40); j < i; j++) {
      const d = Math.hypot(lit[i].x - lit[j].x, lit[i].y - lit[j].y);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    if (best >= 0 && bestD <= THRESHOLD) {
      lines.push({
        x1: lit[i].x,
        y1: lit[i].y,
        x2: lit[best].x,
        y2: lit[best].y,
        opacity: 0.1 + (1 - bestD / THRESHOLD) * 0.12,
      });
    }
  }

  const radius = stars.reduce((m, s) => Math.max(m, Math.hypot(s.x, s.y)), 0);
  return { stars, lines, radius };
}

export const MILESTONES = [
  { days: 30, text: 'Your sky is beginning to take shape.' },
  { days: 100, text: 'A constellation has formed.' },
  { days: 365, text: 'A whole year of stars.' },
];

/** The warmest milestone the user has already reached (never mentions loss). */
export function currentMilestone(count: number): string | null {
  let msg: string | null = null;
  for (const m of MILESTONES) if (count >= m.days) msg = m.text;
  return msg;
}
