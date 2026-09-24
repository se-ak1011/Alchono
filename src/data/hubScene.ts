import type { ImageSourcePropType } from "react-native";

/**
 * The 00s CD-ROM adventure hub, described entirely as data.
 *
 * Each node is one first-person viewpoint you stand in. Hotspots are fractional
 * rectangles over the node image (x/y = top-left, w/h = size, all 0..1), and
 * they're diegetic — no label painted on the scene; the name shows in the
 * bottom caption bar, LucasArts-style. The *engine* never hard-codes art, so
 * dropping in Marta's redrawn 00s scenes later is: swap the `image`, nudge a
 * few coordinates. No engine changes.
 *
 * NOTE: everything here is currently PLACEHOLDER art. `cafe` uses the existing
 * café render; `reading` borrows the library (coach) room as a stand-in so
 * first-person travel is real and testable before the period scenes land.
 */

export type HubAction =
  | { kind: "route"; route: string; warn?: boolean }
  | { kind: "node"; node: string };

export type Hotspot = {
  id: string;
  caption: string;
  x: number;
  y: number;
  w: number;
  h: number;
  action: HubAction;
};

// An optional in-scene character (the companion), superposed on a viewpoint.
export type NodeCompanion = {
  caption: string;
  action: HubAction;
  xCenter: number; // 0..1 across the image
  feetY: number; // 0..1 down the image (where the feet land)
  width: number; // 0..1 of screen width
  wh: number; // art aspect ratio (height / width)
};

export type HubNode = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  imgW: number;
  imgH: number;
  // tall  = scrollable portrait (the current placeholder art)
  // screen = fit the viewport, no scroll (future first-person scenes)
  fit: "tall" | "screen";
  hotspots: Hotspot[];
  companion?: NodeCompanion;
  placeholder?: boolean; // true while wearing stand-in art
};

export const HUB_START = "cafe";

export const HUB_NODES: Record<string, HubNode> = {
  cafe: {
    id: "cafe",
    title: "The Café",
    image: require("../../assets/scenes/cafe_home.png"),
    imgW: 853,
    imgH: 1844,
    fit: "tall",
    placeholder: true,
    companion: {
      caption: "Talk to your companion",
      action: { kind: "route", route: "/support/resources" },
      xCenter: 0.4,
      feetY: 0.735,
      width: 0.44,
      wh: 630 / 420,
    },
    hotspots: [
      { id: "support", caption: "Support", x: 0.42, y: 0.09, w: 0.19, h: 0.12, action: { kind: "route", route: "/(tabs)/support" } },
      { id: "me", caption: "Your room", x: 0.11, y: 0.12, w: 0.21, h: 0.14, action: { kind: "route", route: "/(tabs)/profile" } },
      { id: "bar", caption: "The bar", x: 0.63, y: 0.14, w: 0.22, h: 0.16, action: { kind: "route", route: "/barista" } },
      { id: "reading", caption: "Reading corner", x: 0.1, y: 0.24, w: 0.23, h: 0.16, action: { kind: "node", node: "reading" } },
      { id: "games", caption: "Games arcade", x: 0.81, y: 0.15, w: 0.18, h: 0.22, action: { kind: "route", route: "/session/games" } },
      { id: "writing", caption: "Writing space", x: 0.01, y: 0.19, w: 0.17, h: 0.17, action: { kind: "route", route: "/(tabs)/journal" } },
      { id: "resources", caption: "Resources", x: 0.45, y: 0.35, w: 0.17, h: 0.1, action: { kind: "route", route: "/support/resources" } },
      { id: "tonight", caption: "Tonight", x: 0.62, y: 0.4, w: 0.18, h: 0.1, action: { kind: "route", route: "/session/track" } },
      { id: "soul", caption: "The Good News Gazette", x: 0.01, y: 0.57, w: 0.25, h: 0.08, action: { kind: "route", route: "/soul" } },
      { id: "giggles", caption: "The Funny Pages", x: 0.02, y: 0.66, w: 0.25, h: 0.08, action: { kind: "route", route: "/giggles" } },
      { id: "thought", caption: "The Letters Page", x: 0.03, y: 0.75, w: 0.25, h: 0.08, action: { kind: "route", route: "/thought" } },
      { id: "community", caption: "Community", x: 0.25, y: 0.6, w: 0.24, h: 0.16, action: { kind: "route", route: "/community" } },
      { id: "urge", caption: "I need a drink", x: 0.44, y: 0.55, w: 0.51, h: 0.07, action: { kind: "route", route: "/session/urge", warn: true } },
    ],
  },
  reading: {
    id: "reading",
    title: "Reading Corner",
    image: require("../../assets/scenes/coach_room.png"),
    imgW: 853,
    imgH: 1844,
    fit: "tall",
    placeholder: true,
    hotspots: [
      { id: "read", caption: "Sit and read", x: 0.28, y: 0.42, w: 0.44, h: 0.3, action: { kind: "route", route: "/toolkit" } },
      { id: "back", caption: "Back to the café", x: 0.04, y: 0.87, w: 0.44, h: 0.11, action: { kind: "node", node: "cafe" } },
    ],
  },
};
