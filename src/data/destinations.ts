// The catalogue the in-app editor's destination picker offers. Every place a
// hotspot can lead — rooms (other viewpoints), the urge/forest flow, and the
// feature screens — so a hotspot can be fully wired in-app, no code round-trip.
// Reused for the ecosystem/grounds later.
import { HUB_NODES, type HubAction } from "./hubScene";

export type DestItem = { label: string; action: HubAction };
export type DestGroup = { group: string; items: DestItem[] };

// Rooms — generated from the hub graph so new rooms show up automatically.
const roomItems: DestItem[] = Object.values(HUB_NODES).map((n) => ({
  label: `${n.title} · ${n.id}`,
  action: { kind: "node", node: n.id },
}));

export const DESTINATIONS: DestGroup[] = [
  {
    group: "Urge / Forest",
    items: [
      { label: "Urge — walk into the forest", action: { kind: "forest", mode: "walk" } },
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
      { label: "Recommendations (0.0)", action: { kind: "route", route: "/support/recommendations" } },
      { label: "Community", action: { kind: "route", route: "/community" } },
      { label: "Care team", action: { kind: "route", route: "/profile/care-team" } },
      { label: "Trusted person", action: { kind: "route", route: "/profile/trusted" } },
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
      { label: "My Sky (constellation)", action: { kind: "route", route: "/constellation" } },
      { label: "Your moments", action: { kind: "route", route: "/moments" } },
    ],
  },
  {
    group: "Writing",
    items: [
      { label: "Write a note", action: { kind: "route", route: "/journal/write" } },
      { label: "Voice note", action: { kind: "route", route: "/journal/voice" } },
      { label: "Your notes", action: { kind: "route", route: "/journal/notes" } },
      { label: "Letters", action: { kind: "route", route: "/letters/write" } },
    ],
  },
  {
    group: "Games",
    items: [
      { label: "Skull Grove", action: { kind: "route", route: "/arcade/skull-grove" } },
      { label: "Growth Shield", action: { kind: "route", route: "/arcade/growth-shield" } },
      { label: "Skull Path", action: { kind: "route", route: "/arcade/skull-path" } },
      { label: "Skull Haven", action: { kind: "route", route: "/arcade/skull-haven" } },
    ],
  },
  {
    group: "Reading — the 9 books",
    items: [
      { label: "In the moment", action: { kind: "route", route: "/reading/in-the-moment" } },
      { label: "Understand", action: { kind: "route", route: "/reading/understand" } },
      { label: "Triggers", action: { kind: "route", route: "/reading/triggers" } },
      { label: "Planning ahead", action: { kind: "route", route: "/reading/planning-ahead" } },
      { label: "Stress", action: { kind: "route", route: "/reading/stress" } },
      { label: "Sleep", action: { kind: "route", route: "/reading/sleep" } },
      { label: "Relationships", action: { kind: "route", route: "/reading/relationships" } },
      { label: "Identity", action: { kind: "route", route: "/reading/identity" } },
      { label: "After a slip", action: { kind: "route", route: "/reading/after-a-slip" } },
    ],
  },
  {
    group: "Other",
    items: [
      { label: "Bar / drinks menu", action: { kind: "route", route: "/bar/menu" } },
      { label: "The Grounds (ecosystem)", action: { kind: "route", route: "/ecosystem" } },
    ],
  },
];

/** A short, human label for a chosen action — for the inspector button + export. */
export function labelForAction(a?: HubAction): string {
  if (!a) return "— not linked —";
  if (a.kind === "forest") return a.mode === "walk" ? "Forest (walk)" : "Forest (jump)";
  if (a.kind === "node") return `Room → ${HUB_NODES[a.node]?.title ?? a.node}`;
  return a.route;
}

/** The action as a compact string for the export (paste-ready-ish). */
export function actionExport(a?: HubAction): string {
  if (!a) return "(not linked)";
  if (a.kind === "forest") return `forest ${a.mode}`;
  if (a.kind === "node") return `node ${a.node}`;
  return `route ${a.route}`;
}
