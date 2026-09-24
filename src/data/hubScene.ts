import type { ImageSourcePropType } from "react-native";

/**
 * The 00s CD-ROM adventure hub, described entirely as data.
 *
 * Each node is one first-person viewpoint. Hotspots are fractional rectangles
 * over the node IMAGE (x/y = top-left, w/h = size, 0..1). `kind` sets how it
 * signals it's interactive:
 *   - "board"  → chalk label (SkinnyCustard), text only
 *   - "glow"   → a soft breathing light over the object
 *   - "sign"   → text label with a strong shadow (Resources; the urge sign)
 *   - "plain"  → invisible tap target
 * Because the viewpoints overlap, an object visible in more than one view gets
 * a hotspot in EACH view it appears in (e.g. the Me door shows in front + left;
 * the counter shows in front + right).
 *
 * Coordinates below were placed by hand in the in-app drag editor and exported.
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
  label?: string;
  prominent?: boolean;
};

export type HubNode = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  imgW: number;
  imgH: number;
  fit: "tall" | "screen";
  hotspots: Hotspot[];
  left?: string;
  right?: string;
  back?: string;
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
      { id: "community", caption: "Community", kind: "board", label: "Community", x: 0.012, y: 0.242, w: 0.11, h: 0.14, action: { kind: "route", route: "/community" } },
      { id: "reading", caption: "Reading Corner", kind: "board", label: "Reading\nCorner", x: 0.13, y: 0.235, w: 0.13, h: 0.065, action: { kind: "route", route: "/toolkit" } },
      { id: "me", caption: "Me", kind: "board", label: "Me", x: 0.35, y: 0.3, w: 0.08, h: 0.05, action: { kind: "route", route: "/(tabs)/profile" } },
      { id: "support", caption: "Support", kind: "board", label: "Support", x: 0.425, y: 0.207, w: 0.16, h: 0.05, action: { kind: "route", route: "/(tabs)/support" } },
      { id: "mysky", caption: "My Sky", kind: "board", label: "My Sky", x: 0.797, y: 0.249, w: 0.19, h: 0.08, action: { kind: "route", route: "/constellation" } },
      { id: "bar", caption: "Café / Bar", kind: "glow", x: 0.577, y: 0.247, w: 0.15, h: 0.24, action: { kind: "route", route: "/barista" } },
      { id: "games", caption: "Games Arcade", kind: "glow", x: 0.86, y: 0.33, w: 0.14, h: 0.16, action: { kind: "route", route: "/session/games" } },
      { id: "writing", caption: "Writing Space", kind: "glow", x: 0.0, y: 0.555, w: 0.2, h: 0.13, action: { kind: "route", route: "/(tabs)/journal" } },
      { id: "resources", caption: "Resources", kind: "sign", label: "Resources", x: 0.701, y: 0.49, w: 0.14, h: 0.045, action: { kind: "route", route: "/support/resources" } },
      { id: "urge", caption: "I need a drink", kind: "sign", prominent: true, label: "I need a drink", x: 0.64, y: 0.575, w: 0.36, h: 0.08, action: { kind: "route", route: "/session/urge", warn: true } },
    ],
  },

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
      { id: "l_writing", caption: "Writing Space", kind: "glow", x: 0.098, y: 0.114, w: 0.28, h: 0.2, action: { kind: "route", route: "/(tabs)/journal" } },
      { id: "l_papers", caption: "The Good News Gazette", kind: "glow", x: 0.017, y: 0.362, w: 0.24, h: 0.18, action: { kind: "route", route: "/soul" } },
      { id: "l_papers2", caption: "The Funny Pages", kind: "glow", x: 0.017, y: 0.56, w: 0.22, h: 0.16, action: { kind: "route", route: "/giggles" } },
      { id: "l_reading", caption: "Reading Corner", kind: "glow", x: 0.6, y: 0.235, w: 0.34, h: 0.24, action: { kind: "route", route: "/toolkit" } },
      { id: "l_community", caption: "Community", kind: "board", label: "Community", x: 0.3, y: 0.07, w: 0.18, h: 0.12, action: { kind: "route", route: "/community" } },
      { id: "l_me", caption: "Me", kind: "board", label: "Me", x: 0.42, y: 0.2, w: 0.14, h: 0.3, action: { kind: "route", route: "/(tabs)/profile" } },
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
      { id: "r_tonight", caption: "Tonight", kind: "sign", label: "Tonight", x: 0.586, y: 0.508, w: 0.2, h: 0.06, action: { kind: "route", route: "/session/track" } },
      { id: "r_games", caption: "Games Arcade", kind: "glow", x: 0.359, y: 0.29, w: 0.18, h: 0.2, action: { kind: "route", route: "/session/games" } },
      // NEW — everything else visible on the right. Drag each into place.
      { id: "r_bar", caption: "Café / Bar", kind: "glow", x: 0.02, y: 0.3, w: 0.16, h: 0.26, action: { kind: "route", route: "/barista" } },
      { id: "r_resources", caption: "Resources", kind: "sign", label: "Resources", x: 0.13, y: 0.5, w: 0.16, h: 0.05, action: { kind: "route", route: "/support/resources" } },
      { id: "r_urge", caption: "I need a drink", kind: "sign", prominent: true, label: "I need a drink", x: 0.06, y: 0.66, w: 0.5, h: 0.09, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "r_mysky", caption: "My Sky", kind: "board", label: "My Sky", x: 0.72, y: 0.2, w: 0.2, h: 0.1, action: { kind: "route", route: "/constellation" } },
    ],
  },
};
