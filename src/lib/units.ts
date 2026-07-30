/**
 * UK alcohol units, so the drinks diary matches what a GP reads (the NHS
 * "Drinks diary" the doctor hands out). Values are the standard NHS unit
 * figures, so a member never has to do the maths — they pick what they had and
 * the units come with it. (1 unit = 10ml / 8g of pure alcohol.)
 *
 * References: NHS "Alcohol units". Low-risk guideline: no more than 14 units a
 * week for adults, spread over 3+ days; the paper GP diary phrases the daily
 * side as no more than 2–3 units/day for women, 3–4 for men.
 */
export type DrinkPreset = {
  key: string;
  label: string;
  units: number;
};

export const WEEKLY_LOW_RISK_UNITS = 14;

export const DRINK_PRESETS: DrinkPreset[] = [
  { key: 'pint_low', label: 'Pint — lower-strength beer/lager/cider (3.6%)', units: 2 },
  { key: 'pint_high', label: 'Pint — higher-strength beer/lager/cider (5.2%)', units: 3 },
  { key: 'bottle_beer', label: 'Bottle of beer/lager (330ml, 5%)', units: 1.7 },
  { key: 'can_beer', label: 'Can of beer/lager (440ml, 5.5%)', units: 2.4 },
  { key: 'wine_small', label: 'Small glass of wine (125ml)', units: 1.5 },
  { key: 'wine_standard', label: 'Standard glass of wine (175ml)', units: 2.1 },
  { key: 'wine_large', label: 'Large glass of wine (250ml)', units: 3 },
  { key: 'wine_bottle', label: 'Bottle of wine (750ml)', units: 9 },
  { key: 'spirit_single', label: 'Single spirit / shot (25ml)', units: 1 },
  { key: 'spirit_double', label: 'Double spirit (50ml)', units: 2 },
  { key: 'alcopop', label: 'Alcopop (275ml, 5.5%)', units: 1.5 },
  { key: 'other', label: 'Something else (1 unit)', units: 1 },
];

export function presetByKey(key: string): DrinkPreset | undefined {
  return DRINK_PRESETS.find((p) => p.key === key);
}

/** Trim trailing zeros so 2.0 shows as "2" but 1.5 stays "1.5". */
export function fmtUnits(n: number): string {
  return Number(n.toFixed(1)).toString();
}
