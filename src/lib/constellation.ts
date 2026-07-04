// Deterministic procedural star layout for the Recovery Constellation.
//
// Every alcohol-free day becomes one permanent star. Positions grow outward in
// a phyllotaxis (golden-angle) spiral, so the sky fills evenly and gets richer
// the longer recovery continues. The layout is seeded by the user id — so every
// person's sky is unique — and by the date — so a given day always lands in the
// same place. Bad days never remove stars; they only pause new ones.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
const SPACING = 26; // base distance between successive stars

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
  date: string;
  x: number;
  y: number;
  r: number;
  opacity: number;
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
  // A per-user rotation so no two skies align.
  const baseRotation = rand(userSeed + ':rot') * Math.PI * 2;

  const stars: Star[] = dates.map((date, i) => {
    const rr = rand(userSeed + date);
    const rr2 = rand(date + userSeed);
    // Phyllotaxis, with a whisper of jitter so it reads organic not mechanical.
    const radius = SPACING * Math.sqrt(i + 0.5) * (0.92 + rr * 0.16);
    const theta = i * GOLDEN_ANGLE + baseRotation + (rr2 - 0.5) * 0.25;
    return {
      date,
      x: Math.cos(theta) * radius,
      y: Math.sin(theta) * radius,
      r: 1.1 + rr2 * 1.7, // tiny warm-white stars, gently varied
      opacity: 0.55 + rr * 0.45,
    };
  });

  // Faint constellation lines: join each star to its nearest earlier neighbour
  // when they're close enough. Over time this weaves quiet constellations.
  const lines: Line[] = [];
  const THRESHOLD = SPACING * 1.7;
  for (let i = 1; i < stars.length; i++) {
    let best = -1;
    let bestD = Infinity;
    for (let j = Math.max(0, i - 40); j < i; j++) {
      const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    if (best >= 0 && bestD <= THRESHOLD) {
      lines.push({
        x1: stars[i].x,
        y1: stars[i].y,
        x2: stars[best].x,
        y2: stars[best].y,
        opacity: 0.08 + (1 - bestD / THRESHOLD) * 0.1,
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
