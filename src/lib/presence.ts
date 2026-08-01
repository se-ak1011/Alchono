/**
 * MSN-style manual presence: a status the member picks for themselves. No
 * heartbeat, no socket — just a stored choice everyone reads, shown as a
 * coloured dot + label by their handle. "Appear offline" is the lurker's
 * classic: you look offline to the room while still reading it.
 */
export type PresenceStatus = 'online' | 'busy' | 'away' | 'offline';

export const PRESENCE: Record<PresenceStatus, { label: string; dot: string; short: string }> = {
  online: { label: 'Online', dot: '#7FB08A', short: 'online' },
  busy: { label: 'Busy', dot: '#C98282', short: 'busy' },
  away: { label: 'Away', dot: '#E6C56A', short: 'away' },
  offline: { label: 'Appear offline', dot: '#6f6980', short: 'offline' },
};

export const PRESENCE_ORDER: PresenceStatus[] = ['online', 'busy', 'away', 'offline'];

/** Coerce any stored/loaded value to a known status (defaults to online). */
export function asPresence(v: unknown): PresenceStatus {
  return v === 'busy' || v === 'away' || v === 'offline' ? v : 'online';
}
