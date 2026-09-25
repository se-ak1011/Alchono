import type { ImageSourcePropType } from "react-native";

/**
 * The 00s CD-ROM adventure hub, described entirely as data.
 *
 * Each node is one first-person viewpoint. Hotspots are fractional rectangles
 * over the node IMAGE (x/y = top-left, w/h = size, 0..1). Nothing rectangular
 * is ever drawn — a hotspot's box is an invisible, forgiving tap target. `kind`
 * sets what (if anything) is drawn to hint interactivity:
 *   - "label"   → environmental signage, text only, NOT tappable
 *   - "glow"    → interactive object — a soft breathing light bloom, no text
 *   - "primary" → the dominant immediate-help action (the urge sign)
 *   - "board"/"sign" → legacy interactive text labels (left/right views)
 *   - "plain"   → invisible tap target
 * A label and its tap target are independent: the "Writing" sign sits on the
 * blackboard while the desk beneath it is the actual (invisible) hotspot.
 * Because the viewpoints overlap, an object visible in more than one view gets
 * a hotspot in EACH view it appears in (e.g. the Me door shows in front + left;
 * the counter shows in front + right).
 *
 * Coordinates below were placed by hand in the in-app drag editor and exported.
 *
 * Full workflow — adding a room, the editor trick, the field meanings — is in
 * docs/adventure-hub.md.
 */

export type HubAction =
  | { kind: "route"; route: string; warn?: boolean }
  | { kind: "node"; node: string };

export type HotspotKind =
  | "label" // environmental signage — text only, NOT tappable
  | "glow" // interactive object — a soft breathing light bloom, no text
  | "primary" // the dominant immediate-help action (the urge sign)
  | "board" // (legacy) interactive chalk label — text + tap
  | "sign" // (legacy) interactive sign — text + tap
  | "plain"; // invisible tap target

/** How an interactive hotspot behaves conceptually (see docs/adventure-hub.md).
 *  destination = enter a room; preview = zoom into it in place; object = the
 *  object itself is the action. Currently semantic only (previews still route). */
export type Interaction = "destination" | "preview" | "object";

/** Which existing light a glow borrows — a warm object edge or restrained purple. */
export type GlowTint = "warm" | "purple";

export type Haptic = "light" | "medium" | "heavy";

export type Hotspot = {
  id: string;
  caption: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Omitted for `label` hotspots (pure signage, not tappable). */
  action?: HubAction;
  kind?: HotspotKind;
  label?: string;
  prominent?: boolean;
  /** Per-label font size (px, at base scale). Omit for the kind's default.
   *  It's a cap — text still shrinks to fit its box. */
  labelSize?: number;
  /** Semantic interaction type (destination/preview/object). */
  interaction?: Interaction;
  /** Glow bloom colour — borrow warm object light or a restrained purple. */
  tint?: GlowTint;
  /** Concentrate the glow at a point inside the box (0..1), e.g. a doorknob. */
  anchor?: { x: number; y: number };
  /** Glow size vs its box (1 ≈ fills it). Smaller = a tighter gleam. */
  glowScale?: number;
  /** Haptic strength on tap. Defaults to light. */
  haptic?: Haptic;
};

export type HubNode = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  /** Optional second layer, same composition as `image` but with the object
   *  glows painted in. The engine cross-fades its opacity 0→1→0 so the baked
   *  glows "breathe" together. When set, glow hotspots draw no engine bloom —
   *  the art carries the affordance. */
  glowImage?: ImageSourcePropType;
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
    glowImage: require("../../assets/scenes/cafe_front_glow.png"),
    imgW: 851,
    imgH: 1848,
    fit: "screen",
    left: "left",
    right: "right",
    // NOTE: after the interaction redesign, labels and tap targets are separate.
    // The lbl_* entries are non-tappable signage kept at the old (good) board
    // positions; the interactive entries below them need dragging onto their
    // real objects in the editor (desk, armchair, door, curtain, phone), then
    // exported. See docs/adventure-hub.md.
    hotspots: [
      // — environmental signage (text only, NOT tappable) —
      // (No "Writing" label in the front view — the board above the desk is the
      // Community preview; the Writing sign lives only in the left view.)
      { id: "lbl_reading", caption: "Reading Corner", kind: "label", label: "Reading\nCorner", x: 0.138, y: 0.231, w: 0.134, h: 0.061 },
      { id: "lbl_me", caption: "Me", kind: "label", label: "Me", labelSize: 12, x: 0.341, y: 0.3, w: 0.106, h: 0.057 },
      { id: "lbl_support", caption: "Support", kind: "label", label: "Support", x: 0.425, y: 0.207, w: 0.16, h: 0.05 },
      { id: "lbl_resources", caption: "Resources", kind: "label", label: "Resources", x: 0.665, y: 0.48, w: 0.223, h: 0.033 },

      // — destinations (enter a room); the object glows, not a box —
      { id: "writing", caption: "Writing", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", x: 0.026, y: 0.556, w: 0.2, h: 0.13, action: { kind: "route", route: "/(tabs)/journal" } },
      { id: "me", caption: "Me", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", anchor: { x: 0.82, y: 0.55 }, glowScale: 0.4, x: 0.34, y: 0.3, w: 0.12, h: 0.34, action: { kind: "route", route: "/(tabs)/profile" } },
      { id: "support", caption: "Support", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", x: 0.44, y: 0.26, w: 0.16, h: 0.34, action: { kind: "route", route: "/(tabs)/support" } },

      // — previews (zoom in place later; open the room for now) —
      { id: "community", caption: "Community", kind: "glow", tint: "purple", interaction: "preview", haptic: "light", glowScale: 0.9, x: 0.012, y: 0.242, w: 0.11, h: 0.14, action: { kind: "route", route: "/community" } },
      { id: "reading", caption: "Reading Corner", kind: "glow", tint: "warm", interaction: "preview", haptic: "light", x: 0.1, y: 0.4, w: 0.2, h: 0.22, action: { kind: "route", route: "/toolkit" } },
      { id: "mysky", caption: "My Sky", kind: "glow", tint: "purple", interaction: "preview", haptic: "light", glowScale: 0.9, x: 0.789, y: 0.249, w: 0.19, h: 0.08, action: { kind: "route", route: "/constellation" } },

      // — objects (the object itself communicates its function) —
      { id: "bar", caption: "The Bar", kind: "glow", tint: "warm", interaction: "object", haptic: "light", x: 0.578, y: 0.286, w: 0.125, h: 0.171, action: { kind: "route", route: "/barista" } },
      { id: "games", caption: "Games", kind: "glow", tint: "purple", interaction: "object", haptic: "medium", anchor: { x: 0.5, y: 0.4 }, glowScale: 0.5, x: 0.904, y: 0.345, w: 0.096, h: 0.123, action: { kind: "route", route: "/session/games" } },
      { id: "resources", caption: "Resources", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.6, x: 0.62, y: 0.45, w: 0.1, h: 0.07, action: { kind: "route", route: "/support/resources" } },

      // — primary immediate-help action (dominant; distinct heavy haptic) —
      { id: "urge", caption: "I need a drink", kind: "primary", label: "I need a drink", interaction: "object", haptic: "heavy", x: 0.616, y: 0.576, w: 0.36, h: 0.08, action: { kind: "route", route: "/session/urge", warn: true } },
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
    hotspots: [
      { id: "l_writing", caption: "Writing Space", kind: "glow", x: 0.364, y: 0.475, w: 0.22, h: 0.23, action: { kind: "route", route: "/(tabs)/journal" } },
      { id: "l_papers", caption: "The Good News Gazette", kind: "glow", x: 0.0, y: 0.42, w: 0.303, h: 0.103, action: { kind: "route", route: "/soul" } },
      { id: "l_papers2", caption: "The Funny Pages", kind: "glow", x: 0.013, y: 0.641, w: 0.283, h: 0.096, action: { kind: "route", route: "/giggles" } },
      { id: "l_papers3", caption: "The Letters Page", kind: "glow", x: 0.031, y: 0.854, w: 0.297, h: 0.085, action: { kind: "route", route: "/thought" } },
      { id: "l_reading", caption: "Reading Corner", kind: "glow", x: 0.627, y: 0.148, w: 0.174, h: 0.354, action: { kind: "route", route: "/toolkit" } },
      { id: "l_community", caption: "Community", kind: "board", label: "Community", x: 0.442, y: 0.146, w: 0.153, h: 0.184, action: { kind: "route", route: "/community" } },
      { id: "l_me", caption: "Me", kind: "board", label: "Me", labelSize: 12, x: 0.788, y: 0.251, w: 0.169, h: 0.116, action: { kind: "route", route: "/(tabs)/profile" } },
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
    hotspots: [
      { id: "r_tonight", caption: "Tonight", kind: "sign", label: "Tonight", x: 0.483, y: 0.463, w: 0.248, h: 0.073, action: { kind: "route", route: "/session/track" } },
      { id: "r_games", caption: "Games Arcade", kind: "glow", x: 0.352, y: 0.287, w: 0.104, h: 0.138, action: { kind: "route", route: "/session/games" } },
      { id: "r_bar", caption: "Café / Bar", kind: "glow", x: 0.09, y: 0.231, w: 0.115, h: 0.194, action: { kind: "route", route: "/barista" } },
      { id: "r_resources", caption: "Resources", kind: "sign", label: "Resources", x: 0.196, y: 0.438, w: 0.16, h: 0.05, action: { kind: "route", route: "/support/resources" } },
      { id: "r_urge", caption: "I need a drink", kind: "sign", prominent: true, label: "I need a drink", x: 0.096, y: 0.544, w: 0.5, h: 0.09, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "r_mysky", caption: "My Sky", kind: "board", label: "My Sky", x: 0.366, y: 0.201, w: 0.105, h: 0.081, action: { kind: "route", route: "/constellation" } },
    ],
  },
};
