import { supabase } from '@/lib/supabase';

/**
 * Batch-fetch usernames via the public_profiles view (safe columns only —
 * the profiles table itself is owner-only under RLS).
 */
export async function fetchUsernames(
  ids: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return {};
  const { data } = await supabase
    .from('public_profiles')
    .select('id, username')
    .in('id', unique);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.id) map[row.id] = row.username ?? 'Member';
  }
  return map;
}
