// The Alchono arcade games — self-contained HTML pages (in assets/arcade-games),
// inlined as strings at build time and shown in a WebView "cabinet". Keyed by
// the slug used in the /arcade/[game] route and by each device's hotspot.
import skullGrove from '../../assets/arcade-games/skull-defense-1.html';
import growthShield from '../../assets/arcade-games/skull-defense-2.html';
import skullPath from '../../assets/arcade-games/growth-journey.html';
import skullHaven from '../../assets/arcade-games/haven-builder.html';

export type ArcadeGame = { title: string; html: string };

export const ARCADE_GAMES: Record<string, ArcadeGame> = {
  'skull-grove': { title: 'Skull Grove', html: skullGrove },
  'growth-shield': { title: 'Growth Shield', html: growthShield },
  'skull-path': { title: 'Skull Path', html: skullPath },
  'skull-haven': { title: 'Skull Haven', html: skullHaven },
};

export const getArcadeGame = (id?: string | null) => (id ? ARCADE_GAMES[id] : undefined);
