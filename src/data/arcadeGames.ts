// The Alchono arcade games — self-contained HTML pages (in assets/arcade-games),
// inlined as strings at build time and shown in a WebView "cabinet". Keyed by
// the slug used in the /arcade/[game] route and by each device's hotspot.
// One game per console: Game Boy → Skull Patrol, Arcade → Grave Shift, PS1 → Spirit Drift.
import skullPatrol from '../../assets/arcade-games/skull-patrol.html';
import graveShift from '../../assets/arcade-games/grave-shift.html';
import spiritDrift from '../../assets/arcade-games/spirit-drift.html';

// Looped idle previews — lighter auto-playing loops shown on a cabinet screen
// (an editor inlay option), separate from the full playable games above.
import skullPatrolPreview from '../../assets/arcade-games/skull-patrol-preview.html';
import graveShiftPreview from '../../assets/arcade-games/grave-shift-preview.html';
import spiritDriftPreview from '../../assets/arcade-games/spirit-drift-preview.html';

export type ArcadeGame = { title: string; html: string };

/** Looped preview HTML, keyed by the same slug as the playable game. */
export const ARCADE_PREVIEWS: Record<string, string> = {
  'skull-patrol': skullPatrolPreview,
  'grave-shift': graveShiftPreview,
  'spirit-drift': spiritDriftPreview,
};

export const ARCADE_GAMES: Record<string, ArcadeGame> = {
  'skull-patrol': { title: 'Skull Patrol', html: skullPatrol },
  'grave-shift': { title: 'Grave Shift', html: graveShift },
  'spirit-drift': { title: 'Spirit Drift', html: spiritDrift },
};

export const getArcadeGame = (id?: string | null) => (id ? ARCADE_GAMES[id] : undefined);
