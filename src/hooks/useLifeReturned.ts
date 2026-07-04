import { useMemo } from 'react';
import { useAfDaysCount } from '@/hooks/useVictories';
import { useJournalEntries } from '@/hooks/useJournal';

export type LifeReturnedItem = { key: string; label: string };

/**
 * "Life Returned" — the everyday things alcohol quietly steals, given back.
 * Framed around what recovery ADDS, not what it removes. Derived from existing
 * data (alcohol-free days, reflections) so it's honest, not aspirational.
 */
export function useLifeReturned(days: number): LifeReturnedItem[] {
  const { data: afDays = 0 } = useAfDaysCount(days);
  const { data: journals = [] } = useJournalEntries(days);

  return useMemo(() => {
    const rows = journals as any[];
    const tag = (t: string) =>
      rows.filter((j) => (j.went_well ?? []).includes(t)).length;
    const proud = rows.filter((j) =>
      (j.notes ?? '').toLowerCase().includes('proud'),
    ).length;

    const rest = tag('Rest');
    const food = tag('Good food');
    const people = tag('Friends') + tag('Family');
    const hobby = tag('Creative') + tag('Outdoors') + tag('Movement');

    const plural = (n: number, s: string, p = s + 's') => (n === 1 ? s : p);

    const items: LifeReturnedItem[] = [];
    if (afDays > 0) {
      items.push({
        key: 'clear',
        label: `${afDays} ${plural(afDays, 'morning')} without a hangover`,
      });
      items.push({
        key: 'money',
        // A gentle, conservative estimate — never a hard claim.
        label: `Roughly £${afDays * 6} kept, not poured away`,
      });
      items.push({
        key: 'drive',
        label: `${afDays} ${plural(afDays, 'day')} you could drive whenever you wanted`,
      });
    }
    if (rest > 0)
      items.push({ key: 'rest', label: `${rest} ${plural(rest, 'night')} of better sleep` });
    if (food > 0)
      items.push({ key: 'food', label: `${food} ${plural(food, 'meal')} you actually enjoyed` });
    if (people > 0)
      items.push({
        key: 'people',
        label: `${people} ${plural(people, 'time')} you were fully there for someone`,
      });
    if (hobby > 0)
      items.push({
        key: 'hobby',
        label: `${hobby} ${plural(hobby, 'thing')} you did just because you could`,
      });
    if (proud > 0)
      items.push({ key: 'proud', label: `${proud} ${plural(proud, 'day')} you felt proud` });

    return items;
  }, [afDays, journals]);
}
