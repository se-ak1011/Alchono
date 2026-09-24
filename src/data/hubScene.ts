import type { ImageSourcePropType } from "react-native";

/**
 * The 00s CD-ROM adventure hub, described entirely as data.
 *
 * Each node is one first-person viewpoint. Hotspots are fractional rectangles
 * over the node IMAGE (x/y = top-left, w/h = size, all 0..1). How a hotspot
 * signals it's interactive is its `kind`:
 *   - "board"  → chalk label rendered on the board (SkinnyCustard = chalk)
 *   - "glow"   → a soft breathing light over the object (light = touchable)
 *   - "sign"   → a small period sign with text (Resources; the urge sign)
 *   - "plain"  → invisible tap target
 * Labels/previews live on the boards; self-evident objects glow; the caption
 * bar names whatever the finger is on. The engine never hard-codes art, so
 * swapping in a redrawn scene is: replace the image, nudge coordinates.
 *
 * Coordinates below are first estimates against Marta's front render and WILL
 * need tuning on-device — that's a one-number change each, by design.
 */

export type HubAction =
  | { kind: "route"; route: string; warn?: boolean }
  | { kind: "node"; node: string };

export type HotspotKind = "board" | "glow" | "sign" | "plain";

export type Hotspot = {
  id: string;
  caption: string;
  x: number;
  y: number;
  w: number;
  h: number;
  action: HubAction;
  kind?: HotspotKind;
  label?: string; // chalk text for "board", sign text for "sign"
  prominent?: boolean; // emphasise (the urge sign)
};

export type HubNode = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  imgW: number;
  imgH: number;
  fit: "tall" | "screen";
  hotspots: Hotspot[];
  left?: string; // node reached by turning left
  right?: string; // node reached by turning right
  back?: string; // node reached by the back arrow
  placeholder?: boolean;
};

export const HUB_START = "front";

export const HUB_NODES: Record<string, HubNode> = {
  front: {
    id: "front",
    title: "The Café",
    image: require("../../assets/scenes/cafe_front.png"),
    imgW: 851,
    imgH: 1848,
    fit: "screen",
    left: "left",
    right: "right",
    hotspots: [
      // Boards — the chalk label is the button (previews land here later).
      { id: "community", caption: "Community", kind: "board", label: "Community", x: 0.01, y: 0.27, w: 0.11, h: 0.14, action: { kind: "route", route: "/community" } },
      { id: "reading", caption: "Reading Corner", kind: "board", label: "Reading\nCorner", x: 0.13, y: 0.235, w: 0.13, h: 0.065, action: { kind: "route", route: "/toolkit" } },
      { id: "me", caption: "Me", kind: "board", label: "Me", x: 0.305, y: 0.28, w: 0.08, h: 0.05, action: { kind: "route", route: "/(tabs)/profile" } },
      { id: "support", caption: "Support", kind: "board", label: "Support", x: 0.41, y: 0.225, w: 0.16, h: 0.05, action: { kind: "route", route: "/(tabs)/support" } },
      { id: "mysky", caption: "My Sky", kind: "board", label: "My Sky", x: 0.76, y: 0.28, w: 0.19, h: 0.08, action: { kind: "route", route: "/constellation" } },
      // Glow objects — light says "touch me".
      { id: "bar", caption: "Café / Bar", kind: "glow", x: 0.55, y: 0.285, w: 0.15, h: 0.24, action: { kind: "route", route: "/barista" } },
      { id: "games", caption: "Games Arcade", kind: "glow", x: 0.85, y: 0.36, w: 0.14, h: 0.16, action: { kind: "route", route: "/session/games" } },
      { id: "writing", caption: "Writing Space", kind: "glow", x: 0.0, y: 0.5, w: 0.2, h: 0.13, action: { kind: "route", route: "/(tabs)/journal" } },
      // Signs.
      { id: "resources", caption: "Resources", kind: "sign", label: "Resources", x: 0.66, y: 0.465, w: 0.14, h: 0.045, action: { kind: "route", route: "/support/resources" } },
      { id: "urge", caption: "I need a drink", kind: "sign", prominent: true, label: "I need a drink", x: 0.57, y: 0.6, w: 0.36, h: 0.08, action: { kind: "route", route: "/session/urge", warn: true } },
    ],
  },

  // Placeholder side views (your earlier left/right art) so turning is real
  // and testable until the tall period versions land.
  left: {
    id: "left",
    title: "Reading & Writing",
    image: require("../../assets/scenes/cafe_left_ph.png"),
    imgW: 941,
    imgH: 1672,
    fit: "screen",
    back: "front",
    placeholder: true,
    hotspots: [
      { id: "l_writing", caption: "Writing Space", kind: "glow", x: 0.04, y: 0.42, w: 0.28, h: 0.2, action: { kind: "route", route: "/(tabs)/journal" } },
      { id: "l_papers", caption: "The papers", kind: "glow", x: 0.0, y: 0.62, w: 0.24, h: 0.2, action: { kind: "route", route: "/soul" } },
      { id: "l_reading", caption: "Reading Corner", kind: "glow", x: 0.5, y: 0.36, w: 0.34, h: 0.24, action: { kind: "route", route: "/toolkit" } },
    ],
  },
  right: {
    id: "right",
    title: "The Counter",
    image: require("../../assets/scenes/cafe_right_ph.png"),
    imgW: 941,
    imgH: 1672,
    fit: "screen",
    back: "front",
    placeholder: true,
    hotspots: [
      { id: "r_tonight", caption: "Tonight", kind: "sign", label: "Tonight", x: 0.42, y: 0.46, w: 0.2, h: 0.06, action: { kind: "route", route: "/session/track" } },
      { id: "r_games", caption: "Games Arcade", kind: "glow", x: 0.8, y: 0.34, w: 0.18, h: 0.2, action: { kind: "route", route: "/session/games" } },
    ],
  },
};
