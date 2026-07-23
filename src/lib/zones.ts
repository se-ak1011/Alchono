/**
 * The destinations that orbit the companion on Home, and fill the hamburger
 * drawer. One source of truth so the orbit and the menu never drift.
 *
 * Colour is the "zone" system: plum-charcoal stays the base everywhere; each
 * place carries ONE muted accent, used only on its chip, its header and its
 * edges — cohesive, never colourful for its own sake. `tint`/`edge` are the
 * translucent forms used on dark surfaces; `accent` is the solid hue for a
 * header rule or icon.
 */
export type ZoneKey =
  | 'reading'
  | 'writing'
  | 'community'
  | 'games'
  | 'support'
  | 'me'
  | 'urge';

export interface Zone {
  key: ZoneKey;
  label: string;
  /** Single-letter monogram (in the display font) — replaces emojis. */
  monogram: string;
  route: string;
  /** Solid accent hue for headers/icons. */
  accent: string;
  /** Translucent fill for a chip disc on the dark base. */
  tint: string;
  /** Translucent border for the chip disc. */
  edge: string;
}

export const ZONES: Record<ZoneKey, Zone> = {
  reading: {
    key: 'reading',
    label: 'Reading Corner',
    monogram: 'R',
    route: '/toolkit',
    accent: '#B296D0', // heather purple
    tint: 'rgba(139,107,168,0.20)',
    edge: 'rgba(178,150,208,0.42)',
  },
  writing: {
    key: 'writing',
    label: 'Writing Room',
    monogram: 'W',
    route: '/(tabs)/journal',
    accent: '#CE969E', // dusty rose
    tint: 'rgba(178,120,130,0.18)',
    edge: 'rgba(206,150,158,0.40)',
  },
  community: {
    key: 'community',
    label: 'Community Hub',
    monogram: 'C',
    route: '/community',
    accent: '#9EBE96', // muted sage
    tint: 'rgba(122,150,120,0.18)',
    edge: 'rgba(158,190,150,0.40)',
  },
  games: {
    key: 'games',
    label: 'Games Arcade',
    monogram: 'G',
    route: '/session/games',
    accent: '#D6B678', // muted amber
    tint: 'rgba(190,158,96,0.18)',
    edge: 'rgba(214,182,120,0.42)',
  },
  support: {
    key: 'support',
    label: 'Support',
    monogram: 'S',
    route: '/(tabs)/support',
    accent: '#A082BE', // deep plum
    tint: 'rgba(120,90,150,0.22)',
    edge: 'rgba(160,130,190,0.44)',
  },
  me: {
    key: 'me',
    label: 'Me',
    monogram: 'M',
    route: '/(tabs)/profile',
    accent: '#B4AEA2', // warm grey
    tint: 'rgba(150,144,132,0.16)',
    edge: 'rgba(180,174,162,0.34)',
  },
  // The urge flow — the one place boldness is allowed. Dark aubergine, always
  // findable at the base of Home as a filled pill (not an orbit disc).
  urge: {
    key: 'urge',
    label: 'I want a drink',
    monogram: '!',
    route: '/session/urge',
    accent: '#3B3352',
    tint: 'rgba(59,51,82,0.9)',
    edge: 'rgba(190,160,210,0.5)',
  },
};

/** The six calm zones that orbit the companion (urge is handled separately). */
export const ORBIT_ZONES: Zone[] = [
  ZONES.reading,
  ZONES.writing,
  ZONES.community,
  ZONES.games,
  ZONES.support,
  ZONES.me,
];

/** Every destination, in the order the hamburger drawer lists them. */
export const DRAWER_ZONES: Zone[] = [
  ZONES.reading,
  ZONES.writing,
  ZONES.community,
  ZONES.games,
  ZONES.support,
  ZONES.me,
  ZONES.urge,
];
