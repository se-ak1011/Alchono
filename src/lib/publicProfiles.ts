import { supabase } from '@/lib/supabase';
import { asPresence, type PresenceStatus } from '@/lib/presence';

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

/**
 * Batch-fetch chosen presence status per user. Resilient by design: if the
 * migration (036) hasn't been applied yet the column is missing and the
 * select errors — we swallow it and return {}, so the room simply shows no
 * status labels rather than breaking.
 */
export async function fetchPresence(
  ids: string[],
): Promise<Record<string, PresenceStatus>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return {};
  try {
    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, presence_status')
      .in('id', unique);
    if (error) return {};
    const map: Record<string, PresenceStatus> = {};
    for (const row of (data as any[]) ?? []) {
      if (row?.id) map[row.id] = asPresence(row.presence_status);
    }
    return map;
  } catch {
    return {};
  }
}
