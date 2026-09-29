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
  | { kind: "route"; route: string; warn?: boolean; returnNode?: string }
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
  /** Affordance opacity 0..1 (the editor's "Opacity"). Dim a label or inlay so it
   *  blends as a subtle, discoverable detail rather than bold signage. */
  opacity?: number;
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
      { id: "writing", caption: "Writing", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowMax: 0.65, x: 0.023, y: 0.534, w: 0.192, h: 0.114, action: { kind: "node", node: "writing_desk" } },
      { id: "me", caption: "Me", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", anchor: { x: 0.82, y: 0.55 }, glowScale: 0.5, glowMax: 0.65, x: 0.235, y: 0.37, w: 0.127, h: 0.059, action: { kind: "node", node: "me_front" } },
      { id: "support", caption: "Support", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 1.05, glowMax: 0.65, x: 0.437, y: 0.374, w: 0.148, h: 0.097, action: { kind: "node", node: "support" } },

      // — live objects: content painted on, tap enters the room directly —
      { id: "community", caption: "Community", kind: "glow", tint: "purple", interaction: "destination", inlay: "community", haptic: "light", glowScale: 0.9, glowMax: 0.6, rotate: 1, rotateY: 40, x: 0.018, y: 0.249, w: 0.112, h: 0.123, action: { kind: "route", route: "/community" } },
      { id: "reading", caption: "Reading Corner", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowMax: 0.65, x: 0.102, y: 0.431, w: 0.192, h: 0.09, action: { kind: "node", node: "reading_shelf" } },
      { id: "mysky", caption: "My Sky", kind: "glow", tint: "warm", interaction: "destination", inlay: "sky", haptic: "light", glowScale: 0.9, glowMax: 0.6, rotate: -4, rotateY: -30, x: 0.801, y: 0.259, w: 0.17, h: 0.06, action: { kind: "route", route: "/constellation" } },

      // — objects (the object itself communicates its function) —
      { id: "bar", caption: "The Bar", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowMax: 0.65, x: 0.612, y: 0.338, w: 0.253, h: 0.053, action: { kind: "node", node: "cafebar" } },
      { id: "games", caption: "Games", kind: "glow", tint: "purple", interaction: "object", inlay: "arcade", haptic: "medium", anchor: { x: 0.5, y: 0.4 }, glowScale: 0.5, glowMax: 0.8, rotate: 7, rotateX: 30, x: 0.923, y: 0.395, w: 0.089, h: 0.041, action: { kind: "node", node: "arcade" } },
      { id: "resources", caption: "Resources", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.6, glowMax: 0.65, x: 0.744, y: 0.423, w: 0.12, h: 0.081, action: { kind: "route", route: "/resources/home" } },

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
    // Side arrow panning back toward the counter side, the way the arcade/support
    // side-views connect back to their room-front. Keeps the "look around" feel
    // consistent across every room, instead of forcing a trip through Back.
    right: "front",
    back: "front",
    hotspots: [
      { id: "l_writing", caption: "Writing Space", kind: "glow", tint: "warm", glowMax: 0.65, x: 0.341, y: 0.474, w: 0.22, h: 0.23, action: { kind: "node", node: "writing_desk" } },
      // The rack: tiny routing glows (paper previews removed — real newspapers
      // will be drawn into the baskets, with name-sticker labels added in-app).
      // Reposition onto the baskets in the editor.
      { id: "l_papers", caption: "The Good News Gazette", kind: "glow", tint: "warm", interaction: "destination", glowMax: 0.65, x: 0.074, y: 0.503, w: 0.115, h: 0.068, action: { kind: "route", route: "/soul" } },
      { id: "l_papers2", caption: "The Funny Pages", kind: "glow", tint: "warm", interaction: "destination", glowMax: 0.65, x: 0.076, y: 0.583, w: 0.142, h: 0.079, action: { kind: "route", route: "/giggles" } },
      { id: "l_papers3", caption: "The Letters Page", kind: "glow", tint: "warm", interaction: "destination", glowMax: 0.65, x: 0.065, y: 0.669, w: 0.136, h: 0.076, action: { kind: "route", route: "/thought" } },
      { id: "l_reading", caption: "Reading Corner", kind: "glow", glowMax: 0.65, x: 0.637, y: 0.326, w: 0.144, h: 0.164, action: { kind: "node", node: "reading_shelf" } },
      { id: "l_community", caption: "Community", kind: "board", label: "Community", labelSize: 15, rotate: 8, x: 0.356, y: 0.102, w: 0.3, h: 0.089, action: { kind: "route", route: "/community" } },
      // Live videos on the board face below the "Community" sign, tilted into
      // the wall — same inlay as the front.
      { id: "l_community_board", caption: "Community", kind: "glow", tint: "purple", interaction: "destination", inlay: "community", rotate: 1, rotateY: 44, x: 0.445, y: 0.172, w: 0.112, h: 0.134, action: { kind: "route", route: "/community" } },
      { id: "l_me", caption: "Me", kind: "board", label: "Me", labelSize: 17, x: 0.755, y: 0.154, w: 0.169, h: 0.116, action: { kind: "node", node: "me_front" } },
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
    // Side arrow panning back toward the reading/writing side — mirror of the
    // left view, matching the arcade/support side-to-side navigation.
    left: "front",
    back: "front",
    hotspots: [
      { id: "r_tonight", caption: "Tonight", kind: "sign", label: "Tonight", labelSize: 17, rotate: 14, x: 0.472, y: 0.45, w: 0.248, h: 0.073, action: { kind: "route", route: "/session/track" } },
      { id: "r_games", caption: "Games Arcade", kind: "glow", interaction: "object", inlay: "arcade", glowMax: 0.6, rotate: 9, rotateY: -10, rotateX: 26, x: 0.382, y: 0.347, w: 0.068, h: 0.043, action: { kind: "node", node: "arcade" } },
      { id: "r_bar", caption: "Café / Bar", kind: "glow", glowMax: 0.65, x: 0.116, y: 0.279, w: 0.234, h: 0.08, action: { kind: "node", node: "cafebar" } },
      { id: "r_resources", caption: "Resources", kind: "sign", label: "Resources", labelSize: 15, rotate: 8, x: 0.134, y: 0.431, w: 0.16, h: 0.05, action: { kind: "route", route: "/resources/home" } },
      { id: "r_urge", caption: "I need a drink", kind: "sign", prominent: true, label: "I need a drink", labelSize: 22, rotate: 26, x: 0.075, y: 0.63, w: 0.5, h: 0.09, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "r_mysky", caption: "My Sky", kind: "board", label: "My Sky", labelSize: 10, interaction: "destination", inlay: "sky", x: 0.396, y: 0.209, w: 0.063, h: 0.055, action: { kind: "route", route: "/constellation" } },
      // Added in-app: new glows — DESTINATIONS PENDING (inert until wired).
      // The Zine — a cover pinned to the corkboard (a live preview; tap to read).
      { id: "r_zine", caption: "The Zine", kind: "glow", tint: "warm", interaction: "destination", inlay: "zine", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.618, y: 0.149, w: 0.201, h: 0.123, action: { kind: "route", route: "/newsletter" } },
      { id: "r_glow_2", caption: "New spot", kind: "glow", tint: "warm", glowScale: 0.7, glowMax: 0.65, x: 0.209, y: 0.384, w: 0.122, h: 0.079 },
      { id: "r_glow_3", caption: "New spot", kind: "glow", tint: "warm", glowScale: 0.6, glowMax: 0.65, x: 0.61, y: 0.416, w: 0.127, h: 0.094 },
      // Vertical "24/7" sign (stacked characters), tilted onto the board.
      { id: "r_247", caption: "24/7", kind: "label", label: "2\n4\n/\n7", labelSize: 44, rotateY: -30, opacity: 0.5, x: 0.502, y: 0.165, w: 0.076, h: 0.268 },
    ],
  },

  // Reading close-up — zoom into the bookshelf from the café Reading Corner.
  // Each pre-drawn book (title + emblem baked into the art) is an invisible tap
  // target that opens its toolkit category. Books read left→right, top→bottom in
  // the same order as the Reading Corner grid. Rough boxes — drag each onto its
  // spine in the editor and export; the back arrow exits to the café.
  reading_shelf: {
    id: "reading_shelf",
    title: "Reading Corner",
    image: require("../../assets/scenes/reading_shelf.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    back: "front",
    hotspots: [
      // Top shelf.
      { id: "bk_moment", caption: "In the moment", kind: "plain", interaction: "destination", haptic: "light", x: 0.121, y: 0.101, w: 0.085, h: 0.2, action: { kind: "route", route: "/reading/in-the-moment" } },
      { id: "bk_understand", caption: "Understand", kind: "plain", interaction: "destination", haptic: "light", x: 0.221, y: 0.098, w: 0.085, h: 0.2, action: { kind: "route", route: "/reading/understand" } },
      { id: "bk_triggers", caption: "Triggers", kind: "plain", interaction: "destination", haptic: "light", x: 0.317, y: 0.097, w: 0.085, h: 0.2, action: { kind: "route", route: "/reading/triggers" } },
      // Middle shelf.
      { id: "bk_planning", caption: "Planning ahead", kind: "plain", interaction: "destination", haptic: "light", x: 0.561, y: 0.371, w: 0.095, h: 0.19, action: { kind: "route", route: "/reading/planning-ahead" } },
      { id: "bk_stress", caption: "Stress", kind: "plain", interaction: "destination", haptic: "light", x: 0.674, y: 0.369, w: 0.085, h: 0.19, action: { kind: "route", route: "/reading/stress" } },
      { id: "bk_sleep", caption: "Sleep", kind: "plain", interaction: "destination", haptic: "light", x: 0.772, y: 0.368, w: 0.085, h: 0.19, action: { kind: "route", route: "/reading/sleep" } },
      // Bottom shelf.
      { id: "bk_relationships", caption: "Relationships", kind: "plain", interaction: "destination", haptic: "light", x: 0.258, y: 0.626, w: 0.095, h: 0.2, action: { kind: "route", route: "/reading/relationships" } },
      { id: "bk_identity", caption: "Identity", kind: "plain", interaction: "destination", haptic: "light", x: 0.378, y: 0.629, w: 0.085, h: 0.2, action: { kind: "route", route: "/reading/identity" } },
      { id: "bk_slip", caption: "After a slip", kind: "plain", interaction: "destination", haptic: "light", x: 0.482, y: 0.626, w: 0.095, h: 0.2, action: { kind: "route", route: "/reading/after-a-slip" } },
    ],
  },

  // Writing close-up — zoom into the desk from the café Writing Space. Each
  // object on the desk is a different way to write. A soft glow hints each is
  // tappable; drag onto the exact object in the editor and export.
  writing_desk: {
    id: "writing_desk",
    title: "Writing Space",
    image: require("../../assets/scenes/writing_desk.png"),
    imgW: 851,
    imgH: 1848,
    fit: "screen",
    back: "front",
    hotspots: [
      // The open notebook → write a note.
      { id: "wd_note", caption: "A note", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.7, glowMax: 0.5, x: 0.144, y: 0.607, w: 0.62, h: 0.17, action: { kind: "route", route: "/journal/write" } },
      // The envelopes → write a letter.
      { id: "wd_letters", caption: "Letters", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.65, glowMax: 0.6, x: 0.62, y: 0.5, w: 0.36, h: 0.1, action: { kind: "route", route: "/letters/write" } },
      // The voice recorder → the Voice note screen: a big mic you press to record.
      { id: "wd_voice", caption: "Voice note", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.7, glowMax: 0.65, x: 0.061, y: 0.501, w: 0.2, h: 0.09, action: { kind: "route", route: "/journal/voice" } },
      // The paper tray → your saved notes.
      { id: "wd_notes", caption: "Your notes", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.6, glowMax: 0.55, x: 0.658, y: 0.375, w: 0.32, h: 0.1, action: { kind: "route", route: "/journal/notes" } },
      // Drink safety-valve, present in every room (easy to move or delete in-app).
      { id: "wd_urge", caption: "I need a drink", kind: "primary", label: "I need a drink", labelSize: 20, interaction: "object", haptic: "heavy", x: 0.28, y: 0.8, w: 0.44, h: 0.08, action: { kind: "route", route: "/session/urge", warn: true } },
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
      { id: "a_memory", caption: "Memory Match", kind: "glow", interaction: "object", inlay: "arcade_memory", glowMax: 0.6, x: 0.19, y: 0.301, w: 0.119, h: 0.068, action: { kind: "route", route: "/session/memory-match", returnNode: "arcade" } },
      { id: "a_pattern", caption: "Pattern", kind: "glow", interaction: "object", inlay: "arcade_pattern", glowMax: 0.6, x: 0.39, y: 0.3, w: 0.118, h: 0.066, action: { kind: "route", route: "/session/simon", returnNode: "arcade" } },
      { id: "a_odd", caption: "Odd One Out", kind: "glow", interaction: "object", inlay: "arcade", glowMax: 0.6, x: 0.587, y: 0.299, w: 0.117, h: 0.066, action: { kind: "route", route: "/session/odd-one-out", returnNode: "arcade" } },
      { id: "a_colour", caption: "Colour Match", kind: "glow", interaction: "object", inlay: "arcade_colour", glowMax: 0.6, rotate: 12, rotateY: -36, rotateX: 14, x: 0.858, y: 0.315, w: 0.118, h: 0.066, action: { kind: "route", route: "/session/stroop", returnNode: "arcade" } },
      // Word Search runs on the retro computer on the desk.
      { id: "a_word", caption: "Word Search", kind: "glow", interaction: "object", inlay: "arcade_word", glowMax: 0.6, rotate: 3, x: 0.346, y: 0.428, w: 0.083, h: 0.033, action: { kind: "route", route: "/session/word-search", returnNode: "arcade" } },
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
      // The left door → the Bar (the arcade sits by the bar on the café view).
      // Destination changed from Support; the chalk sign is relabelled on screen.
      { id: "al_bar", caption: "The Bar", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.4, glowMax: 0.65, x: 0.132, y: 0.334, w: 0.254, h: 0.21, action: { kind: "node", node: "cafebar" } },
      // Chalk sign on the door (added in-app) — relabel to "Bar" in the editor.
      { id: "al_lbl_support", caption: "Cafe Bar", kind: "label", label: "CAFE-BAR", labelSize: 24, rotate: 14, rotateY: 18, rotateX: 12, x: 0.074, y: 0.181, w: 0.2, h: 0.08 },
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
      // Colour Match seen from the side, tilted onto the angled cabinet.
      { id: "ar_colour", caption: "Colour Match", kind: "glow", interaction: "object", inlay: "arcade_colour", glowMax: 0.6, rotate: 25, rotateY: -22, rotateX: 44, x: 0.174, y: 0.412, w: 0.088, h: 0.05, action: { kind: "route", route: "/session/stroop", returnNode: "arcade" } },
      // The door → Tonight (drink-tracking): the right-side "way out".
      { id: "ar_tonight", caption: "Tonight", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowMax: 0.6, x: 0.771, y: 0.433, w: 0.109, h: 0.087, action: { kind: "route", route: "/session/track" } },
      // The retro phone → Resources (same as the café landline).
      { id: "ar_resources", caption: "Resources", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.7, x: 0.424, y: 0.41, w: 0.13, h: 0.083, action: { kind: "route", route: "/resources/arcade" } },
    ],
  },

  // The Support room — entered from the café's Support curtain. A warm lounge:
  // sit with a mentor, talk to the coach, read recovery, check messages. Every
  // known feature is pre-placed at a rough box; position/tilt in the editor and
  // export in one pass. The two doors are building connections — inert until you
  // tell me where each goes.
  support: {
    id: "support",
    title: "Support",
    image: require("../../assets/scenes/support_front.png"),
    imgW: 853,
    imgH: 1843,
    fit: "screen",
    left: "support_left",
    right: "support_right",
    back: "front",
    hotspots: [
      // AI Coach — the armchairs + table (a big, only-thing-here tap zone).
      { id: "s_coach", caption: "AI Coach", kind: "sign", label: "AI Coach", labelSize: 23, rotate: 1, rotateY: 14, interaction: "destination", haptic: "medium", x: 0.125, y: 0.173, w: 0.72, h: 0.3, action: { kind: "route", route: "/support/coach" } },
      { id: "s_urge", caption: "I need a drink", kind: "primary", label: "I need a drink", labelSize: 22, interaction: "object", haptic: "heavy", x: 0.3, y: 0.82, w: 0.4, h: 0.08, action: { kind: "route", route: "/session/urge", warn: true } },
    ],
  },
  support_left: {
    id: "support_left",
    title: "Support",
    image: require("../../assets/scenes/support_left.png"),
    imgW: 853,
    imgH: 1844,
    fit: "screen",
    right: "support",
    back: "front",
    hotspots: [
      // Recovery — the writing desk + chair.
      { id: "s_recovery", caption: "Recovery", kind: "sign", label: "Recovery", labelSize: 15, rotateY: 34, rotateX: -4, interaction: "destination", haptic: "medium", x: 0.242, y: 0.38, w: 0.3, h: 0.1, action: { kind: "route", route: "/support/recovery" } },
      // Mentors — the empty corkboard above the desk.
      { id: "s_mentors", caption: "Mentors", kind: "sign", label: "Mentors", labelSize: 18, rotate: 10, rotateY: 42, interaction: "destination", haptic: "medium", x: 0.284, y: 0.18, w: 0.3, h: 0.12, action: { kind: "route", route: "/support/mentors" } },
      // The left-view door → Me (profile).
      { id: "sl_door", caption: "Me", kind: "glow", tint: "warm", interaction: "destination", glowScale: 0.4, glowMax: 0.6, x: -0.037, y: 0.371, w: 0.218, h: 0.104, action: { kind: "node", node: "me_front" } },
      // "Me" chalked on the door (added in-app).
      { id: "sl_lbl_me", caption: "Me", kind: "label", label: "Me", labelSize: 18, rotate: 8, rotateY: 32, x: 0.028, y: 0.169, w: 0.2, h: 0.08 },
    ],
  },
  support_right: {
    id: "support_right",
    title: "Support",
    image: require("../../assets/scenes/support_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "support",
    back: "front",
    hotspots: [
      // Messages — on the computer screen.
      { id: "s_messages", caption: "Messages", kind: "sign", label: "Messages", labelSize: 11, interaction: "destination", haptic: "medium", x: 0.309, y: 0.332, w: 0.22, h: 0.08, action: { kind: "route", route: "/messages" } },
      // Recommendations — the 4-card corkboard (0.0 alcohol-free swaps).
      { id: "s_recommendations", caption: "Recommendations", kind: "glow", tint: "purple", interaction: "destination", glowScale: 0.6, glowMax: 0.6, x: 0.174, y: 0.213, w: 0.334, h: 0.117, action: { kind: "route", route: "/support/recommendations" } },
      // The right-view door → the Bar (labelled "Break Room").
      { id: "sr_door", caption: "Break Room", kind: "glow", tint: "warm", interaction: "destination", glowScale: 0.4, glowMax: 0.6, x: 0.54, y: 0.341, w: 0.158, h: 0.073, action: { kind: "node", node: "breakroom" } },
      // "BREAK ROOM" chalked on the door (added in-app).
      { id: "sr_lbl_break", caption: "Break Room", kind: "label", label: "BREAK ROOM", rotate: 3, rotateY: 20, x: 0.599, y: 0.193, w: 0.2, h: 0.08 },
    ],
  },

  // The Me room — your private space, entered from the café/support "Me".
  // Deliberately NO doors to other rooms: the one place you close the door and
  // you're just here. Only L↔F↔R and the back arrow out to the café.
  me_front: {
    id: "me_front",
    title: "Me",
    image: require("../../assets/scenes/me_front.png"),
    imgW: 851,
    imgH: 1848,
    fit: "screen",
    left: "me_left",
    right: "me_right",
    back: "front",
    hotspots: [
      // My Sky — the window full of stars.
      { id: "mf_sky", caption: "My Sky", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.9, glowMax: 0.55, x: 0.16, y: 0.13, w: 0.68, h: 0.4, action: { kind: "route", route: "/constellation" } },
      { id: "mf_lbl_sky", caption: "My Sky", kind: "label", label: "My Sky", labelSize: 14, x: 0.4, y: 0.5, w: 0.2, h: 0.05 },
      // AI Coach — the armchair (same coach as Support).
      { id: "mf_coach", caption: "AI Coach", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.6, x: 0.0, y: 0.56, w: 0.28, h: 0.22, action: { kind: "route", route: "/support/coach" } },
      { id: "mf_lbl_coach", caption: "AI Coach", kind: "label", label: "AI Coach", labelSize: 14, x: 0.02, y: 0.5, w: 0.24, h: 0.05 },
    ],
  },
  me_left: {
    id: "me_left",
    title: "Me",
    image: require("../../assets/scenes/me_left.png"),
    imgW: 851,
    imgH: 1848,
    fit: "screen",
    right: "me_front",
    back: "front",
    hotspots: [
      // Profile — the tall locker.
      { id: "ml_profile", caption: "Profile", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.5, glowMax: 0.6, x: 0.0, y: 0.23, w: 0.24, h: 0.48, action: { kind: "route", route: "/account" } },
      { id: "ml_lbl_profile", caption: "Profile", kind: "label", label: "Profile", labelSize: 14, x: 0.02, y: 0.68, w: 0.2, h: 0.05 },
      // Your moments — the corkboard.
      { id: "ml_moments", caption: "Your moments", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.28, y: 0.24, w: 0.33, h: 0.26, action: { kind: "route", route: "/moments" } },
      { id: "ml_lbl_moments", caption: "Your moments", kind: "label", label: "Your moments", labelSize: 13, x: 0.3, y: 0.3, w: 0.28, h: 0.05 },
      // Looking forward to — the purple notebook on the desk.
      { id: "ml_goals", caption: "Looking forward to", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.5, glowMax: 0.6, x: 0.28, y: 0.5, w: 0.14, h: 0.05, action: { kind: "route", route: "/goals" } },
      { id: "ml_lbl_goals", caption: "Looking forward to", kind: "label", label: "Looking forward to", labelSize: 12, x: 0.26, y: 0.56, w: 0.32, h: 0.05 },
      // My circumstances — the desk drawers. The living page: your situation,
      // edited whenever it changes, read by the AI coach.
      { id: "ml_circumstances", caption: "My circumstances", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.5, glowMax: 0.6, x: 0.3, y: 0.58, w: 0.2, h: 0.06, action: { kind: "route", route: "/profile/preferences" } },
      { id: "ml_lbl_circumstances", caption: "My circumstances", kind: "label", label: "My circumstances", labelSize: 11, x: 0.28, y: 0.64, w: 0.28, h: 0.05 },
    ],
  },
  me_right: {
    id: "me_right",
    title: "Me",
    image: require("../../assets/scenes/me_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "me_front",
    back: "front",
    hotspots: [
      // Tonight — the bedside lamp (drink tracking).
      { id: "mr_tonight", caption: "Tonight", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.6, x: 0.16, y: 0.36, w: 0.16, h: 0.14, action: { kind: "route", route: "/session/track" } },
      { id: "mr_lbl_tonight", caption: "Tonight", kind: "label", label: "Tonight", labelSize: 13, x: 0.13, y: 0.5, w: 0.22, h: 0.05 },
      // Care team + Trusted person — the bed (your human safety net).
      { id: "mr_care", caption: "Care team", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.5, x: 0.5, y: 0.5, w: 0.3, h: 0.13, action: { kind: "route", route: "/profile/care-team" } },
      { id: "mr_lbl_care", caption: "Care team", kind: "label", label: "Care team", labelSize: 13, x: 0.52, y: 0.55, w: 0.26, h: 0.05 },
      { id: "mr_trusted", caption: "Trusted person", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.5, x: 0.44, y: 0.66, w: 0.42, h: 0.16, action: { kind: "route", route: "/profile/trusted" } },
      { id: "mr_lbl_trusted", caption: "Trusted person", kind: "label", label: "Trusted person", labelSize: 12, x: 0.5, y: 0.72, w: 0.32, h: 0.05 },
      // Saved — the bedside drawers (your favourites stash).
      { id: "mr_saved", caption: "Saved", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.6, x: 0.05, y: 0.52, w: 0.28, h: 0.2, action: { kind: "route", route: "/saved" } },
      { id: "mr_lbl_saved", caption: "Saved", kind: "label", label: "Saved", labelSize: 14, x: 0.06, y: 0.48, w: 0.2, h: 0.05 },
    ],
  },

  // The Café-Bar — mocktails you can make at home. A 2-view room, entered from
  // the café's right counter (and the arcade's CAFE-BAR door); turn left for the
  // mixing station. The back arrow exits to the café.
  cafebar: {
    id: "cafebar",
    title: "Café-Bar",
    image: require("../../assets/scenes/cafebar_front.png"),
    imgW: 851,
    imgH: 1848,
    fit: "screen",
    left: "cafebar_left",
    back: "front",
    hotspots: [
      // The recipe book on the counter → the mocktail menu (the current bar page).
      { id: "cb_recipes", caption: "Recipes", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.5, glowMax: 0.6, x: 0.02, y: 0.39, w: 0.19, h: 0.05, action: { kind: "route", route: "/barista" } },
      { id: "cb_lbl_recipes", caption: "Recipes", kind: "label", label: "Recipes", labelSize: 13, x: 0.02, y: 0.33, w: 0.2, h: 0.05 },
      // The fridge of cans → 0.0 alcohol-free recommendations (grab one in).
      { id: "cb_fridge", caption: "0.0 Fridge", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.6, glowMax: 0.5, x: 0.0, y: 0.31, w: 0.19, h: 0.11, action: { kind: "route", route: "/support/recommendations" } },
      { id: "cb_lbl_fridge", caption: "0.0 Fridge", kind: "label", label: "0.0 Fridge", labelSize: 12, x: 0.0, y: 0.44, w: 0.2, h: 0.05 },
    ],
  },
  cafebar_left: {
    id: "cafebar_left",
    title: "Café-Bar",
    image: require("../../assets/scenes/cafebar_left.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    right: "cafebar",
    back: "front",
    hotspots: [
      // The recipe book → the mocktail menu.
      { id: "cbl_recipes", caption: "Recipes", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.5, glowMax: 0.6, x: 0.82, y: 0.42, w: 0.16, h: 0.06, action: { kind: "route", route: "/barista" } },
      { id: "cbl_lbl_recipes", caption: "Recipes", kind: "label", label: "Recipes", labelSize: 13, x: 0.78, y: 0.37, w: 0.2, h: 0.05 },
      // The fridge of cans → 0.0 recommendations.
      { id: "cbl_fridge", caption: "0.0 Fridge", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.6, glowMax: 0.5, x: 0.83, y: 0.31, w: 0.15, h: 0.1, action: { kind: "route", route: "/support/recommendations" } },
      { id: "cbl_lbl_fridge", caption: "0.0 Fridge", kind: "label", label: "0.0 Fridge", labelSize: 12, x: 0.78, y: 0.25, w: 0.2, h: 0.05 },
      // The door on the left → the Support room (a building connection).
      { id: "cbl_door", caption: "Support", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.4, glowMax: 0.6, x: 0.0, y: 0.24, w: 0.16, h: 0.32, action: { kind: "node", node: "support" } },
      { id: "cbl_lbl_door", caption: "Support", kind: "label", label: "Support", labelSize: 13, x: 0.0, y: 0.2, w: 0.18, h: 0.05 },
    ],
  },

  // The Break Room — the second bar/social room. A 2-view room entered from the
  // Support-right "Break Room" door: you arrive at the vending machine (front),
  // turn right for the table + the door out. The right door leads "outside" to
  // the wider-life stuff (ecosystem) rather than back to Support, so the rooms
  // don't form a closed loop.
  breakroom: {
    id: "breakroom",
    title: "Break Room",
    image: require("../../assets/scenes/breakroom_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    right: "breakroom_right",
    back: "front",
    hotspots: [
      // The vending machine → 0.0 alcohol-free recommendations.
      { id: "br_vending", caption: "0.0 Drinks", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.6, glowMax: 0.45, x: 0.04, y: 0.23, w: 0.36, h: 0.4, action: { kind: "route", route: "/support/recommendations" } },
      { id: "br_lbl_vending", caption: "0.0 Drinks", kind: "label", label: "0.0 Drinks", labelSize: 12, x: 0.04, y: 0.18, w: 0.3, h: 0.05 },
    ],
  },
  breakroom_right: {
    id: "breakroom_right",
    title: "Break Room",
    image: require("../../assets/scenes/breakroom_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "breakroom",
    back: "front",
    hotspots: [
      // The table → Community (the social gathering place).
      { id: "brr_table", caption: "Community", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.7, glowMax: 0.5, x: 0.18, y: 0.42, w: 0.5, h: 0.22, action: { kind: "route", route: "/community" } },
      { id: "brr_lbl_table", caption: "Community", kind: "label", label: "Community", labelSize: 13, x: 0.3, y: 0.48, w: 0.26, h: 0.05 },
      // The door → "outside": the wider-life stuff (struggling with something else).
      { id: "brr_door", caption: "Outside", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.4, glowMax: 0.6, x: 0.78, y: 0.16, w: 0.2, h: 0.46, action: { kind: "node", node: "outside" } },
      { id: "brr_lbl_door", caption: "Outside", kind: "label", label: "Outside", labelSize: 13, x: 0.76, y: 0.12, w: 0.22, h: 0.05 },
    ],
  },

  // The outdoor space — "outside" from the Break Room, for the wider-life stuff.
  // A single view for now, but drawn to open up further to the right later (an
  // interactive outdoors). The board carries the "struggling with something else"
  // content; the door is a shortcut to the café counter; back → the Break Room.
  outside: {
    id: "outside",
    title: "Outside",
    image: require("../../assets/scenes/outside.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    back: "breakroom_right",
    hotspots: [
      // The board → "struggling with something else" content.
      { id: "out_board", caption: "Something else", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.5, x: 0.33, y: 0.27, w: 0.35, h: 0.24, action: { kind: "route", route: "/ecosystem" } },
      { id: "out_lbl_board", caption: "Something else", kind: "label", label: "Something else", labelSize: 12, x: 0.31, y: 0.22, w: 0.4, h: 0.05 },
      // The door → the café counter (Home right view).
      { id: "out_door", caption: "Café", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.4, glowMax: 0.6, x: 0.02, y: 0.2, w: 0.24, h: 0.5, action: { kind: "node", node: "right" } },
      { id: "out_lbl_door", caption: "Café", kind: "label", label: "Café", labelSize: 13, x: 0.02, y: 0.15, w: 0.2, h: 0.05 },
    ],
  },
};
