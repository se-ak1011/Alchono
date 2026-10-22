// The catalogue the in-app editor's destination picker offers. Every place a
// hotspot can lead — rooms (other viewpoints), the urge/forest flow, and the
// feature screens — so a hotspot can be fully wired in-app, no code round-trip.
// Reused for the ecosystem/grounds later.
import { HUB_NODES, type HubAction } from "./hubScene";

export type DestItem = { label: string; action: HubAction };
export type DestGroup = { group: string; items: DestItem[] };

// Nodes hidden from the auto-generated "Rooms" list — legacy/retired views, and
// close-ups that are reached their own way (carousels + the explicit groups below).
// The nodes still EXIST in hubScene (not purged yet); this only declutters the picker.
const HIDDEN_FROM_PICKER = new Set<string>([
  // old forest entrance option (woods now entered via the front path → forest_hall)
  "forest_canopy",
  // retired games room
  "entertainment_left", "entertainment_front", "entertainment_right",
  // retired upstairs — replaced by the loft
  "landing_front", "landing_left", "landing_right",
  "study_left", "study_front", "study_right", "reading_shelf",
  "me_room_left", "me_room_front", "me_room_right", "bathroom",
  // old archway → the (now orphaned) forest exterior
  "exterior_forest",
  // resources close-ups — handled by the explicit "Resources" group below
  "resources_living", "resources_entertainment", "resources_study",
  "resources_kitchen", "resources_outdoors",
  // the 0.0 deck is a carousel: only the beer card is the entry (in "Drinks" below);
  // the rest are swiped to inside, never linked separately
  "zerozero_beer", "zerozero_cider", "zerozero_spirits", "zerozero_wine",
]);

// Rooms — generated from the hub graph so new rooms show up automatically,
// minus the hidden set above.
const roomItems: DestItem[] = Object.values(HUB_NODES)
  .filter((n) => !HIDDEN_FROM_PICKER.has(n.id))
  .map((n) => ({
    label: `${n.title} · ${n.id}`,
    action: { kind: "node", node: n.id },
  }));

export const DESTINATIONS: DestGroup[] = [
  {
    group: "Urge / Forest",
    items: [
      { label: "Urge — jump to the clearing", action: { kind: "forest", mode: "jump" } },
    ],
  },
  { group: "Rooms (walk through here)", items: roomItems },
  {
    group: "Support & people",
    items: [
      { label: "AI Coach", action: { kind: "route", route: "/support/coach" } },
      { label: "Recovery", action: { kind: "route", route: "/support/recovery" } },
      { label: "Mentors", action: { kind: "route", route: "/support/mentors" } },
      { label: "Messages", action: { kind: "route", route: "/messages" } },
      { label: "Community", action: { kind: "route", route: "/community" } },
      { label: "Connections (care team + trusted)", action: { kind: "route", route: "/profile/connections" } },
    ],
  },
  {
    group: "You & tracking",
    items: [
      { label: "Tonight (track a drink)", action: { kind: "route", route: "/session/track" } },
      { label: "Looking forward to (goals)", action: { kind: "route", route: "/goals" } },
      { label: "Saved", action: { kind: "route", route: "/saved" } },
      { label: "Personal file", action: { kind: "route", route: "/profile/file" } },
      { label: "Your moments", action: { kind: "route", route: "/moments" } },
    ],
  },
  {
    // The writing-desk close-up is the entry; write/voice/notes/letters are for
    // wiring the zones INSIDE that close-up.
    group: "Writing",
    items: [
      { label: "Writing desk (close-up)", action: { kind: "route", route: "/journal" } },
      { label: "Write a note", action: { kind: "route", route: "/journal/write" } },
      { label: "Voice note", action: { kind: "route", route: "/journal/voice" } },
      { label: "Your notes", action: { kind: "route", route: "/journal/notes" } },
      { label: "Letters", action: { kind: "route", route: "/letters/write" } },
    ],
  },
  {
    group: "Games",
    items: [
      { label: "Skull Patrol", action: { kind: "route", route: "/arcade/skull-patrol" } },
      { label: "Grave Shift", action: { kind: "route", route: "/arcade/grave-shift" } },
      { label: "Spirit Drift", action: { kind: "route", route: "/arcade/spirit-drift" } },
    ],
  },
  {
    // Magazines are a carousel now — only the table (close-up) and the shelf (the
    // carousel itself) are entries; individual articles are swiped to inside.
    group: "Reading",
    items: [
      { label: "Reading table (close-up)", action: { kind: "route", route: "/reading/table" } },
      { label: "The magazines — all reading", action: { kind: "route", route: "/reading" } },
    ],
  },
  {
    // Resources now = the typewriter Book + the handwritten Note, plus the outdoor
    // close-up (which stays). Indoor per-room close-ups retired from the picker.
    group: "Resources",
    items: [
      { label: "Resources — Book", action: { kind: "route", route: "/resources/book" } },
      { label: "Resources — Note", action: { kind: "route", route: "/resources/note" } },
      { label: "Resources — Outside", action: { kind: "node", node: "resources_outdoors" } },
    ],
  },
  {
    group: "Drinks (instead-of)",
    items: [
      { label: "0.0 drinks deck", action: { kind: "node", node: "zerozero_beer" } },
      { label: "Mocktails (menu)", action: { kind: "route", route: "/bar/menu" } },
    ],
  },
  {
    // Each tappable LINE of a resources close-up — wire a tap zone over the line to
    // the matching one of these (they open the phone/text/website directly).
    group: "Crisis lines (resources)",
    items: [
      { label: "999 (call)", action: { kind: "link", url: "tel:999" } },
      { label: "Samaritans — 116 123 (call)", action: { kind: "link", url: "tel:116123" } },
      { label: "NHS 111 (call)", action: { kind: "link", url: "tel:111" } },
      { label: "Drinkline — 0300 123 1110 (call)", action: { kind: "link", url: "tel:03001231110" } },
      { label: "AA helpline — 0800 9177 650 (call)", action: { kind: "link", url: "tel:08009177650" } },
      { label: "Al-Anon — 0800 0086 811 (call)", action: { kind: "link", url: "tel:08000086811" } },
      { label: "NACOA — 0800 358 3456 (call)", action: { kind: "link", url: "tel:08003583456" } },
      { label: "Shout — text 85258", action: { kind: "link", url: "sms:85258" } },
      { label: "NHS alcohol advice (web)", action: { kind: "link", url: "https://www.nhs.uk/live-well/alcohol-advice/" } },
      { label: "7 Cups (web)", action: { kind: "link", url: "https://www.7cups.com" } },
      { label: "AA meeting finder (web)", action: { kind: "link", url: "https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting" } },
      { label: "SMART Recovery UK (web)", action: { kind: "link", url: "https://smartrecovery.org.uk" } },
    ],
  },
];

/** A short, human label for a chosen action — for the inspector button + export. */
export function labelForAction(a?: HubAction): string {
  if (!a) return "— not linked —";
  if (a.kind === "forest") return a.mode === "walk" ? "Forest (walk)" : "Forest (jump)";
  if (a.kind === "node") return `Room → ${HUB_NODES[a.node]?.title ?? a.node}`;
  if (a.kind === "link") return a.url;
  return a.route;
}

/** The action as a compact string for the export (paste-ready-ish). */
export function actionExport(a?: HubAction): string {
  if (!a) return "(not linked)";
  if (a.kind === "forest") return `forest ${a.mode}`;
  if (a.kind === "node") return `node ${a.node}`;
  if (a.kind === "link") return `link ${a.url}`;
  return `route ${a.route}`;
}
