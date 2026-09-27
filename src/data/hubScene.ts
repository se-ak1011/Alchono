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
 *  destination = enter a room; preview = (reserved) zoom in place; object = the
 *  object itself is the action. Semantic only — a tap always routes via `action`.
 *  Live content shown on an object comes from its `inlay`, independent of this. */
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
  /** Glow peak opacity 0..1 (the editor's "glow strength"). Default ~0.5. */
  glowMax?: number;
  /** Text rotation in degrees (the editor's "orientation" / spin). */
  rotate?: number;
  /** 3D tilt (degrees) so an inlay sits INTO an angled surface instead of flat on
   *  top of it — depth. `rotateY` turns it left/right into a wall; `rotateX` tips
   *  it up/down. Applied through a perspective, for the painted screens/papers. */
  rotateX?: number;
  rotateY?: number;
  /** Haptic strength on tap. Defaults to light. */
  haptic?: Haptic;
  /** Live content painted onto the object, filling this box (clipped + rotated
   *  to sit on it): the arcade screen mid-game, the board's latest posts, a paper
   *  on the rack. Keyed into INLAYS in AdventureHub. It's pointer-transparent, so
   *  a tap still routes via `action` — the object is alive AND takes you in. */
  inlay?: string;
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
    // Painted glow layer is parked until it can be drawn as a pixel-true overlay
    // on the exact base (a re-generated version drifts and shimmers). Until then
    // the engine draws the soft breathing blooms per glow hotspot.
    // glowImage: require("../../assets/scenes/cafe_front_glow.png"),
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
      // — environmental signage (text only, NOT tappable) — placed + tuned in-app —
      { id: "lbl_community", caption: "Community", kind: "label", label: "Community", labelSize: 11, rotate: 8, x: 0.0, y: 0.207, w: 0.144, h: 0.058 },
      { id: "lbl_reading", caption: "Reading Corner", kind: "label", label: "Reading\nCorner", labelSize: 9, rotate: 6, x: 0.105, y: 0.208, w: 0.17, h: 0.113 },
      { id: "lbl_me", caption: "Me", kind: "label", label: "Me", labelSize: 11, x: 0.329, y: 0.275, w: 0.122, h: 0.094 },
      { id: "lbl_support", caption: "Support", kind: "label", label: "Support", rotate: -4, x: 0.4, y: 0.199, w: 0.197, h: 0.059 },
      { id: "lbl_resources", caption: "Resources", kind: "label", label: "Resources", labelSize: 18, rotate: 8, x: 0.633, y: 0.486, w: 0.223, h: 0.033 },

      // — destinations (enter a room); the object glows, not a box —
      { id: "writing", caption: "Writing", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowMax: 0.65, x: 0.023, y: 0.534, w: 0.192, h: 0.114, action: { kind: "route", route: "/(tabs)/journal" } },
      { id: "me", caption: "Me", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", anchor: { x: 0.82, y: 0.55 }, glowScale: 0.5, glowMax: 0.65, x: 0.235, y: 0.37, w: 0.127, h: 0.059, action: { kind: "route", route: "/(tabs)/profile" } },
      { id: "support", caption: "Support", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 1.05, glowMax: 0.65, x: 0.437, y: 0.374, w: 0.148, h: 0.097, action: { kind: "route", route: "/(tabs)/support" } },

      // — live objects: content painted on, tap enters the room directly —
      { id: "community", caption: "Community", kind: "glow", tint: "purple", interaction: "destination", inlay: "community", haptic: "light", glowScale: 0.9, glowMax: 0.6, rotate: 1, rotateY: 40, x: 0.018, y: 0.249, w: 0.112, h: 0.123, action: { kind: "route", route: "/community" } },
      { id: "reading", caption: "Reading Corner", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowMax: 0.65, x: 0.102, y: 0.431, w: 0.192, h: 0.09, action: { kind: "route", route: "/toolkit" } },
      { id: "mysky", caption: "My Sky", kind: "glow", tint: "warm", interaction: "destination", inlay: "sky", haptic: "light", glowScale: 0.9, glowMax: 0.6, rotate: -4, rotateY: -30, x: 0.801, y: 0.259, w: 0.17, h: 0.06, action: { kind: "route", route: "/constellation" } },

      // — objects (the object itself communicates its function) —
      { id: "bar", caption: "The Bar", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowMax: 0.65, x: 0.612, y: 0.338, w: 0.253, h: 0.053, action: { kind: "route", route: "/barista" } },
      { id: "games", caption: "Games", kind: "glow", tint: "purple", interaction: "object", inlay: "arcade", haptic: "medium", anchor: { x: 0.5, y: 0.4 }, glowScale: 0.5, glowMax: 0.8, rotate: 7, rotateX: 30, x: 0.923, y: 0.395, w: 0.089, h: 0.041, action: { kind: "node", node: "arcade" } },
      { id: "resources", caption: "Resources", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.6, glowMax: 0.65, x: 0.744, y: 0.423, w: 0.12, h: 0.081, action: { kind: "route", route: "/support/resources" } },

      // — primary immediate-help action (dominant; distinct heavy haptic) —
      { id: "urge", caption: "I need a drink", kind: "primary", label: "I need a drink", interaction: "object", haptic: "heavy", labelSize: 20, rotate: 22, x: 0.554, y: 0.67, w: 0.552, h: 0.074, action: { kind: "route", route: "/session/urge", warn: true } },
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
      { id: "l_writing", caption: "Writing Space", kind: "glow", tint: "warm", glowMax: 0.65, x: 0.341, y: 0.474, w: 0.22, h: 0.23, action: { kind: "route", route: "/(tabs)/journal" } },
      // The rack: tiny routing glows (paper previews removed — real newspapers
      // will be drawn into the baskets, with name-sticker labels added in-app).
      // Reposition onto the baskets in the editor.
      { id: "l_papers", caption: "The Good News Gazette", kind: "glow", interaction: "destination", glowMax: 0.65, x: 0.093, y: 0.503, w: 0.17, h: 0.101, action: { kind: "route", route: "/soul" } },
      { id: "l_papers2", caption: "The Funny Pages", kind: "glow", interaction: "destination", glowMax: 0.65, x: 0.013, y: 0.641, w: 0.283, h: 0.096, action: { kind: "route", route: "/giggles" } },
      { id: "l_papers3", caption: "The Letters Page", kind: "glow", interaction: "destination", glowMax: 0.65, x: 0.031, y: 0.854, w: 0.297, h: 0.085, action: { kind: "route", route: "/thought" } },
      { id: "l_reading", caption: "Reading Corner", kind: "glow", glowMax: 0.65, x: 0.637, y: 0.326, w: 0.144, h: 0.164, action: { kind: "route", route: "/toolkit" } },
      { id: "l_community", caption: "Community", kind: "board", label: "Community", labelSize: 15, rotate: 8, x: 0.356, y: 0.102, w: 0.3, h: 0.089, action: { kind: "route", route: "/community" } },
      // Live videos on the board face below the "Community" sign, tilted into
      // the wall — same inlay as the front.
      { id: "l_community_board", caption: "Community", kind: "glow", tint: "purple", interaction: "destination", inlay: "community", rotate: 1, rotateY: 44, x: 0.445, y: 0.172, w: 0.112, h: 0.134, action: { kind: "route", route: "/community" } },
      { id: "l_me", caption: "Me", kind: "board", label: "Me", labelSize: 17, x: 0.755, y: 0.154, w: 0.169, h: 0.116, action: { kind: "route", route: "/(tabs)/profile" } },
      // Added in-app: signage labels (non-tappable).
      { id: "l_lbl_writing", caption: "Writing Space", kind: "label", label: "Writing Space", labelSize: 23, rotate: 2, x: 0.084, y: 0.089, w: 0.285, h: 0.243 },
      { id: "l_lbl_reading", caption: "Reading Corner", kind: "label", label: "Reading Corner", labelSize: 12, rotate: 6, x: 0.629, y: 0.123, w: 0.146, h: 0.127 },
      // Added in-app: new glows — DESTINATIONS PENDING (inert until wired).
      { id: "l_glow_1", caption: "New spot", kind: "glow", tint: "purple", glowScale: 0.8, glowMax: 0.65, x: 0.422, y: 0.159, w: 0.16, h: 0.16 },
      { id: "l_glow_2", caption: "New spot", kind: "glow", tint: "purple", glowScale: 0.8, glowMax: 0.65, x: 0.758, y: 0.136, w: 0.16, h: 0.16 },
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
      { id: "r_tonight", caption: "Tonight", kind: "sign", label: "Tonight", labelSize: 17, rotate: 14, x: 0.472, y: 0.45, w: 0.248, h: 0.073, action: { kind: "route", route: "/session/track" } },
      { id: "r_games", caption: "Games Arcade", kind: "glow", interaction: "object", inlay: "arcade", glowMax: 0.6, rotate: 9, rotateY: -10, rotateX: 26, x: 0.382, y: 0.347, w: 0.068, h: 0.043, action: { kind: "node", node: "arcade" } },
      { id: "r_bar", caption: "Café / Bar", kind: "glow", glowMax: 0.65, x: 0.116, y: 0.279, w: 0.234, h: 0.08, action: { kind: "route", route: "/barista" } },
      { id: "r_resources", caption: "Resources", kind: "sign", label: "Resources", labelSize: 15, rotate: 8, x: 0.134, y: 0.431, w: 0.16, h: 0.05, action: { kind: "route", route: "/support/resources" } },
      { id: "r_urge", caption: "I need a drink", kind: "sign", prominent: true, label: "I need a drink", labelSize: 22, rotate: 26, x: 0.075, y: 0.63, w: 0.5, h: 0.09, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "r_mysky", caption: "My Sky", kind: "board", label: "My Sky", labelSize: 10, interaction: "destination", inlay: "sky", x: 0.396, y: 0.209, w: 0.063, h: 0.055, action: { kind: "route", route: "/constellation" } },
      // Added in-app: new glows — DESTINATIONS PENDING (inert until wired).
      { id: "r_glow_1", caption: "New spot", kind: "glow", tint: "warm", glowScale: 0.8, glowMax: 0.65, x: 0.618, y: 0.149, w: 0.201, h: 0.123 },
      { id: "r_glow_2", caption: "New spot", kind: "glow", tint: "warm", glowScale: 0.7, glowMax: 0.65, x: 0.209, y: 0.384, w: 0.122, h: 0.079 },
      { id: "r_glow_3", caption: "New spot", kind: "glow", tint: "warm", glowScale: 0.6, glowMax: 0.65, x: 0.61, y: 0.416, w: 0.127, h: 0.094 },
    ],
  },

  // The Arcade — its own little room, entered from the café's arcade cabinet.
  // Each cabinet screen plays its game (a live inlay) and a tap launches it.
  // Turn arrows look around; the back arrow exits to the café.
  arcade: {
    id: "arcade",
    title: "The Arcade",
    image: require("../../assets/scenes/arcade_front.png"),
    imgW: 941,
    imgH: 1671,
    fit: "screen",
    left: "arcade_left",
    right: "arcade_right",
    back: "front",
    hotspots: [
      // Rough boxes — drag each onto its cabinet screen in the editor, export.
      { id: "a_memory", caption: "Memory Match", kind: "glow", interaction: "object", inlay: "arcade_memory", glowMax: 0.6, x: 0.06, y: 0.34, w: 0.15, h: 0.09, action: { kind: "route", route: "/session/memory-match" } },
      { id: "a_pattern", caption: "Pattern", kind: "glow", interaction: "object", inlay: "arcade_pattern", glowMax: 0.6, x: 0.29, y: 0.34, w: 0.15, h: 0.09, action: { kind: "route", route: "/session/simon" } },
      { id: "a_odd", caption: "Odd One Out", kind: "glow", interaction: "object", inlay: "arcade", glowMax: 0.6, x: 0.51, y: 0.34, w: 0.15, h: 0.09, action: { kind: "route", route: "/session/odd-one-out" } },
      { id: "a_colour", caption: "Colour Match", kind: "glow", interaction: "object", inlay: "arcade_colour", glowMax: 0.6, x: 0.82, y: 0.37, w: 0.14, h: 0.09, action: { kind: "route", route: "/session/stroop" } },
    ],
  },
  arcade_left: {
    id: "arcade_left",
    title: "The Arcade",
    image: require("../../assets/scenes/arcade_left.png"),
    imgW: 941,
    imgH: 1670,
    fit: "screen",
    right: "arcade",
    back: "front",
    hotspots: [
      // The door → Support: a "way out" that lands on a Home-screen feature.
      // Rough box over the door — place it in the editor.
      { id: "al_support", caption: "Support", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowMax: 0.6, x: 0.06, y: 0.1, w: 0.34, h: 0.7, action: { kind: "route", route: "/(tabs)/support" } },
    ],
  },
  arcade_right: {
    id: "arcade_right",
    title: "The Arcade",
    image: require("../../assets/scenes/arcade_right.png"),
    imgW: 941,
    imgH: 1672,
    fit: "screen",
    left: "arcade",
    back: "front",
    hotspots: [
      // Colour Match seen from the side. Rough box — place on its screen.
      { id: "ar_colour", caption: "Colour Match", kind: "glow", interaction: "object", inlay: "arcade_colour", glowMax: 0.6, x: 0.06, y: 0.42, w: 0.18, h: 0.11, action: { kind: "route", route: "/session/stroop" } },
      // The door → Tonight (drink-tracking): the right-side "way out".
      { id: "ar_tonight", caption: "Tonight", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowMax: 0.6, x: 0.7, y: 0.08, w: 0.3, h: 0.82, action: { kind: "route", route: "/session/track" } },
    ],
  },
};
