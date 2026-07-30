/**
 * The reserved official-account usernames (created in migration 026). Used to
 * recognise official content client-side — e.g. to lead the Stories row with it
 * and badge it — without the feed needing to carry an extra flag.
 */
export const OFFICIAL_USERNAMES = [
  'Alchono',
  'Good Things Department',
  'The Night Shift',
  'Community Starter',
];

export function isOfficialUsername(username?: string | null): boolean {
  return !!username && OFFICIAL_USERNAMES.includes(username);
}
