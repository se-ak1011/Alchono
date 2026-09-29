// The bar's drink recipes — the "mocktail" menu. Shared by the Café-Bar boards
// (each drink name is a hotspot that opens its recipe popup) and the standalone
// Barista screen. Ids are stable slugs used in the /recipe/[id] route.
export type Recipe = {
  id: string;
  name: string;
  tagline: string;
  minutes: number;
  need: string[];
  steps: string[];
};

export const RECIPES: Recipe[] = [
  {
    id: 'sunrise-fizz',
    name: 'Sunrise Fizz',
    tagline: 'Long, cold and fizzy — the closest thing to a proper glass in your hand.',
    minutes: 4,
    need: ['Orange juice', 'Sparkling or cold water', 'Ice', 'A slice of orange (if you have one)'],
    steps: [
      'Fill a tall glass right up with ice — more than feels sensible.',
      'Pour in orange juice until it’s about a third full.',
      'Top slowly with sparkling water and watch it climb.',
      'Perch the orange slice on the rim. Hold it. Sip it slowly.',
    ],
  },
  {
    id: 'honey-lemon',
    name: 'Honey & Lemon Warmer',
    tagline: 'Something warm to wrap both hands around while it steeps.',
    minutes: 5,
    need: ['Hot water', 'Honey (or sugar)', 'Lemon (or a splash of bottled)', 'Cinnamon, optional'],
    steps: [
      'Boil the kettle. While it goes, squeeze the lemon into your favourite mug.',
      'Add a good spoon of honey.',
      'Pour over hot water and stir until the honey vanishes.',
      'Let it sit two minutes — the waiting is part of it. Then hold and sip.',
    ],
  },
  {
    id: 'slow-iced-tea',
    name: 'Slow Iced Tea',
    tagline: 'The one that makes you wait. Brew, cool, pour — a small ritual with time built in.',
    minutes: 8,
    need: ['A tea bag (any)', 'Hot water', 'Ice', 'Lemon or honey, optional'],
    steps: [
      'Brew a strong cup — leave the bag in a little longer than usual.',
      'Take it out and let it cool for a few minutes. Don’t rush this bit.',
      'Fill a glass with ice and pour the tea over — it’ll crackle.',
      'Add lemon or a little honey. Sip somewhere you can sit down.',
    ],
  },
  {
    id: 'cinnamon-steamer',
    name: 'Cinnamon Milk Steamer',
    tagline: 'Frothy, warm and quietly comforting. Whisking it is half the point.',
    minutes: 6,
    need: ['Milk (any kind)', 'Honey', 'A pinch of cinnamon'],
    steps: [
      'Warm a mug of milk gently in a pan — don’t let it boil.',
      'Stir in honey and the cinnamon.',
      'Whisk hard for a minute (a fork works) until it’s frothy on top.',
      'Pour back into the mug and dust a little more cinnamon over the foam.',
    ],
  },
  {
    id: 'mock-mojito',
    name: 'Mock Mojito',
    tagline: 'Muddling is oddly satisfying, and it keeps your hands properly busy.',
    minutes: 5,
    need: ['Sparkling water', 'Lime (or lemon)', 'Fresh mint, if you have it', 'Honey or sugar'],
    steps: [
      'Cut the lime into wedges and drop them in a glass with a little honey.',
      'If you’ve got mint, add a few leaves. Press and twist everything with a spoon.',
      'Fill the glass with ice.',
      'Top with sparkling water, stir, and taste. Adjust the lime to your mood.',
    ],
  },
  {
    id: 'golden-milk',
    name: 'Golden Milk',
    tagline: 'Warm, gold and grounding — a slow one for the end of a hard day.',
    minutes: 6,
    need: ['Milk (any kind)', 'Honey', 'Turmeric or cinnamon', 'A tiny pinch of black pepper'],
    steps: [
      'Warm a mug of milk in a pan on low.',
      'Whisk in a small spoon of turmeric (or cinnamon), honey, and the pinch of pepper.',
      'Keep it just below a simmer for a couple of minutes, stirring.',
      'Pour into a mug, wrap your hands around it, and take your time.',
    ],
  },
];

export const getRecipe = (id?: string | null) => RECIPES.find((r) => r.id === id);
