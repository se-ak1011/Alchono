/**
 * "Food for the ..." — the three small windows of hope, humour and
 * perspective beneath the urge pill on Home. One source of truth for their
 * names, routes and colours, shared by the Home cards and each feed page.
 *
 * Each has its own muted accent, in the app's understated palette:
 *  - Soul: warm gold (kindness + the science of wellbeing)
 *  - Giggles: soft coral (light-hearted retellings)
 *  - Thought: muted teal (anonymous moral dilemmas)
 */
export type FoodKey = 'soul' | 'giggles' | 'thought';

export interface FoodSection {
  key: FoodKey;
  title: string; // full name, for the feed page hero
  lead: string; // the distinctive part, for the compact card ("the Soul")
  route: string;
  blurb: string; // default one-liner teaser
  accent: string;
  tint: string;
  edge: string;
  wash: string; // stronger tint for the page wash gradient top
}

export const FOOD: Record<FoodKey, FoodSection> = {
  soul: {
    key: 'soul',
    title: 'Food for the Soul',
    lead: 'the Soul',
    route: '/soul',
    blurb: 'The world being kind.',
    accent: '#C7B58A',
    tint: 'rgba(199,181,138,0.13)',
    edge: 'rgba(199,181,138,0.34)',
    wash: 'rgba(199,181,138,0.20)',
  },
  giggles: {
    key: 'giggles',
    title: 'Food for the Giggles',
    lead: 'the Giggles',
    route: '/giggles',
    blurb: 'A little levity.',
    accent: '#D6A184',
    tint: 'rgba(214,161,132,0.13)',
    edge: 'rgba(214,161,132,0.34)',
    wash: 'rgba(214,161,132,0.20)',
  },
  thought: {
    key: 'thought',
    title: 'Food for Thought',
    lead: 'Thought',
    route: '/thought',
    blurb: 'A dilemma to sit with.',
    accent: '#8AB2AE',
    tint: 'rgba(138,178,174,0.13)',
    edge: 'rgba(138,178,174,0.34)',
    wash: 'rgba(138,178,174,0.20)',
  },
};

export const FOOD_LIST: FoodSection[] = [FOOD.soul, FOOD.giggles, FOOD.thought];
