/**
 * Alcohol-free (0.0 / 0.5) alternatives, UK-available — the "bridge" phase list.
 * Shared by the Recommendations screen and the support-room corkboard preview
 * (RecommendationsBoardInlay), so both read from one place.
 */
export type Swap = { name: string; note?: string; url?: string };

export const SWAP_CATEGORIES: ReadonlyArray<{ heading: string; items: Swap[] }> = [
  {
    heading: 'Lager & Pilsner',
    items: [
      { name: 'Lucky Saint', note: 'Unfiltered lager — the one people can’t tell apart.', url: 'https://luckysaint.co' },
      { name: 'Heineken 0.0', note: 'In almost every pub and shop.', url: 'https://www.heineken.com/gb/en/heineken-00' },
      { name: "Beck's Blue", note: 'The classic 0.0 pilsner. Everywhere, cheap.', url: 'https://www.becks.de/' },
      { name: 'Days Lager', note: 'UK brewery that only makes alcohol-free.', url: 'https://daysbrewing.com' },
      { name: 'Peroni 0.0' },
      { name: 'Estrella Galicia 0.0' },
      { name: 'Corona Cero' },
      { name: 'Erdinger Alkoholfrei' },
    ],
  },
  {
    heading: 'Stout, Ale & Bitter',
    items: [
      { name: 'Guinness 0.0', note: 'Genuinely tastes like Guinness. Widely stocked.', url: 'https://www.guinness.com/en-gb/our-beers/guinness-0-0' },
      { name: 'Big Drop Paradiso', note: 'Craft, without the morning after.', url: 'https://uk.bigdropbrew.com' },
      { name: 'Doom Bar Zero' },
      { name: 'Adnams Ghost Ship 0.5' },
      { name: 'BrewDog Nanny State' },
    ],
  },
  {
    heading: 'IPA & Pale',
    items: [
      { name: 'BrewDog Punk AF' },
      { name: 'Lucky Saint Hazy IPA' },
      { name: 'Big Drop Pine Trail' },
      { name: 'Days Pale Ale' },
    ],
  },
  {
    heading: 'Spirits & mixers',
    items: [
      { name: 'Seedlip', note: 'The original distilled non-alcoholic spirit. With tonic.', url: 'https://www.seedlipdrinks.com' },
      { name: "Lyre's", note: 'Alcohol-free versions of nearly every spirit.', url: 'https://lyres.co.uk' },
      { name: 'CleanCo', note: 'Clean g(in) and tonic, without the gin part.', url: 'https://clean.co' },
    ],
  },
  {
    heading: 'Cider',
    items: [
      { name: 'Old Mout Alcohol-Free' },
      { name: 'Kopparberg 0.0' },
      { name: 'Thatchers Zero' },
      { name: "Sheppy's Low Alcohol" },
    ],
  },
  {
    heading: 'Wine & Fizz',
    items: [
      { name: 'Torres Natureo', note: 'De-alcoholised wine that still tastes like wine.', url: 'https://www.torres.es/en/wines/natureo' },
      { name: 'Nozeco', note: 'Alcohol-free fizz for toasts.', url: 'https://nozeco.com' },
      { name: 'Eisberg' },
      { name: 'Freixenet 0.0' },
      { name: 'McGuigan Zero' },
    ],
  },
];
