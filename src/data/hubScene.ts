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
    title: "Alchono",
    image: require("../../assets/scenes/home_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "left",
    right: "right",
    // New Alchono lobby. Three views pan together: front (here), left (reception
    // + fire exit), right (arcade/bar + fire exit). The signage is painted into
    // the art, so most labels are gone — the objects just glow. Boxes are rough:
    // drag each onto its object in the in-app editor and export. See
    // docs/adventure-hub.md.
    hotspots: [
      // Coordinates placed in-app and exported. (f_bell removed in the editor.)
      // The SOS "Let's Talk" booth = the urge flow.
      { id: "f_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "object", haptic: "heavy", glowMax: 0.47, x: 0.302, y: 0.528, w: 0.155, h: 0.176, action: { kind: "route", route: "/session/urge", warn: true } },
      // Reception counter objects (phone / ledger).
      { id: "f_phone", caption: "Your people", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowMax: 0.6, x: 0.103, y: 0.405, w: 0.082, h: 0.04, action: { kind: "route", route: "/messages" } },
      { id: "f_ledger", caption: "Tonight", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowMax: 0.55, x: -0.006, y: 0.466, w: 0.211, h: 0.031, action: { kind: "route", route: "/session/track" } },
      // Doors & stairs.
      { id: "f_me", caption: "Me", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.6, x: 0.687, y: 0.053, w: 0.085, h: 0.092, action: { kind: "node", node: "me_front" } },
      { id: "f_support", caption: "Support", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.6, x: 0.728, y: 0.278, w: 0.096, h: 0.115, action: { kind: "node", node: "support" } },
      // Directional signs → where they point. The "← Reading / Writing →" sign
      // is two targets now: Reading (top line) and Writing (bottom line).
      { id: "f_reading", caption: "Reading", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.8, glowMax: 0.55, x: 0.07, y: 0.25, w: 0.19, h: 0.048, action: { kind: "node", node: "reading_room" } },
      { id: "f_writing", caption: "Writing", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.8, glowMax: 0.55, x: 0.07, y: 0.295, w: 0.19, h: 0.048, action: { kind: "node", node: "writing_room" } },
      { id: "f_cafebar", caption: "Café-Bar & Arcade", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.8, glowMax: 0.55, x: 0.891, y: 0.256, w: 0.131, h: 0.049, action: { kind: "node", node: "right" } },
    ],
  },

  left: {
    id: "left",
    title: "Reception & Exit",
    image: require("../../assets/scenes/home_left.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    // Pan right to return to the front; Back also returns to the lobby.
    right: "front",
    back: "front",
    hotspots: [
      // Coordinates placed in-app and exported. (l_keys + l_bell removed.)
      // Fire exit + SOS booth = the urge flow.
      { id: "l_exit", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.3, x: 0.091, y: 0.187, w: 0.208, h: 0.318, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "l_sos", caption: "I need help now", kind: "glow", tint: "warm", interaction: "object", haptic: "heavy", glowMax: 0.37, x: 0.342, y: 0.21, w: 0.13, h: 0.19, action: { kind: "route", route: "/session/urge", warn: true } },
      // The Reception door → the grounds (the other apps).
      { id: "l_reception", caption: "Reception — the grounds", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.4, x: 0.625, y: 0.221, w: 0.16, h: 0.203, action: { kind: "node", node: "reception" } },
      // The counter shows here too (phone / ledger).
      { id: "l_phone", caption: "Your people", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowMax: 0.55, x: 0.879, y: 0.419, w: 0.138, h: 0.045, action: { kind: "route", route: "/messages" } },
      { id: "l_ledger", caption: "Tonight", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowMax: 0.55, x: 0.813, y: 0.491, w: 0.249, h: 0.04, action: { kind: "route", route: "/session/track" } },
    ],
  },
  right: {
    id: "right",
    title: "Arcade & Café-Bar",
    image: require("../../assets/scenes/home_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    // Pan left to return to the front; Back also returns to the lobby.
    left: "front",
    back: "front",
    hotspots: [
      // Coordinates placed in-app and exported.
      // Fire exit + SOS booth = the urge flow (reachable from every view).
      { id: "rt_exit", caption: "I need help now", kind: "glow", tint: "warm", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.4, x: 0.295, y: 0.202, w: 0.156, h: 0.254, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "rt_sos", caption: "I need help now", kind: "glow", tint: "warm", interaction: "object", haptic: "heavy", glowMax: 0.27, x: 0.189, y: 0.206, w: 0.213, h: 0.261, action: { kind: "route", route: "/session/urge", warn: true } },
      // The Arcade door (machines visible through it).
      { id: "rt_arcade", caption: "Arcade", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.4, x: 0.574, y: 0.217, w: 0.168, h: 0.235, action: { kind: "node", node: "arcade" } },
      // The Café-Bar glass doors.
      { id: "rt_cafebar", caption: "Café-Bar", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.4, x: 0.811, y: 0.203, w: 0.172, h: 0.263, action: { kind: "node", node: "cafebar" } },
      // The window onto the garden → Outside (that scene's still being redrawn).
      { id: "rt_window", caption: "The garden", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.6, glowMax: 0.45, x: 0.011, y: 0.151, w: 0.15, h: 0.356, action: { kind: "node", node: "outside" } },
    ],
  },

  // The Reading Room — a cosy nook you walk into: armchair, lamp, bay window.
  // The bookshelf opens the books close-up (the 9 categories). Fire exit + SOS
  // box = the urge flow. No other door — back → the lobby. Rough boxes, tune.
  reading_room: {
    id: "reading_room",
    title: "Reading Room",
    image: require("../../assets/scenes/reading_room.png"),
    imgW: 1024,
    imgH: 1536,
    fit: "screen",
    back: "front",
    hotspots: [
      // The bookshelf → the books close-up.
      { id: "re_shelf", caption: "The books", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.5, x: 0.78, y: 0.13, w: 0.22, h: 0.52, action: { kind: "node", node: "reading_shelf" } },
      // Fire exit + SOS box = the urge flow.
      { id: "re_exit", caption: "I need help now", kind: "glow", tint: "warm", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.45, x: 0.0, y: 0.19, w: 0.17, h: 0.44, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "re_sos", caption: "I need help now", kind: "glow", tint: "warm", interaction: "object", haptic: "heavy", glowMax: 0.5, x: 0.17, y: 0.33, w: 0.1, h: 0.14, action: { kind: "route", route: "/session/urge", warn: true } },
    ],
  },

  // Reading close-up — zoom into the bookshelf from the Reading Room. Each
  // pre-drawn book (title + emblem baked into the art) is an invisible tap
  // target that opens its toolkit category. Books read left→right, top→bottom in
  // the same order as the shelf grid. Rough boxes — drag each onto its spine in
  // the editor and export; the back arrow returns to the Reading Room.
  reading_shelf: {
    id: "reading_shelf",
    title: "Reading Corner",
    image: require("../../assets/scenes/reading_shelf.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    back: "reading_room",
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
    // Back → the Writing Room you're sitting in (not all the way home).
    back: "writing_room",
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

  // The Writing Room — you walk in and sit to write. The desk opens the writing
  // close-up (note / voice / letters / your notes). Fire exit + SOS box = the
  // urge flow; the Support door and the garden window stitch it into the
  // building. Entered from the home-front "Writing" sign; back → the lobby.
  // Rough boxes — tune in the editor and export.
  writing_room: {
    id: "writing_room",
    title: "Writing Room",
    image: require("../../assets/scenes/writing_room.png"),
    imgW: 1024,
    imgH: 1536,
    fit: "screen",
    back: "front",
    hotspots: [
      // The desk → the writing close-up.
      { id: "wr_desk", caption: "Sit and write", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.5, x: 0.0, y: 0.52, w: 0.5, h: 0.3, action: { kind: "node", node: "writing_desk" } },
      // Fire exit + SOS box = the urge flow.
      { id: "wr_exit", caption: "I need help now", kind: "glow", tint: "warm", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.45, x: 0.52, y: 0.21, w: 0.19, h: 0.4, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "wr_sos", caption: "I need help now", kind: "glow", tint: "warm", interaction: "object", haptic: "heavy", glowMax: 0.5, x: 0.44, y: 0.28, w: 0.1, h: 0.15, action: { kind: "route", route: "/session/urge", warn: true } },
      // The Support door → the support room. (The window is just a window.)
      { id: "wr_support", caption: "Support", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.5, x: 0.87, y: 0.3, w: 0.13, h: 0.4, action: { kind: "node", node: "support" } },
    ],
  },

  // The Arcade — a front + right room, entered from the home-right "Arcade" door
  // (and from the Café-Bar). Each device runs one of Marta's purpose-built games
  // in a WebView cabinet (/arcade/<slug>). Fire exit + SOS = the urge flow; the
  // Bar door (right view) connects straight to the Café-Bar. Rough boxes — drag
  // each onto its device/door in the editor and export.
  arcade: {
    id: "arcade",
    title: "The Arcade",
    image: require("../../assets/scenes/arcade_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    right: "arcade_right",
    back: "right",
    hotspots: [
      // The two cabinets → the shooters.
      { id: "a_cab1", caption: "Skull Grove", kind: "glow", tint: "warm", interaction: "object", haptic: "medium", glowScale: 0.7, glowMax: 0.5, x: 0.1, y: 0.26, w: 0.16, h: 0.17, action: { kind: "route", route: "/arcade/skull-grove" } },
      { id: "a_cab2", caption: "Growth Shield", kind: "glow", tint: "purple", interaction: "object", haptic: "medium", glowScale: 0.7, glowMax: 0.5, x: 0.28, y: 0.26, w: 0.16, h: 0.17, action: { kind: "route", route: "/arcade/growth-shield" } },
      // The Game Boy on the table (far left) → Skull Path.
      { id: "a_gameboy", caption: "Skull Path", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.7, glowMax: 0.5, x: 0.0, y: 0.4, w: 0.1, h: 0.08, action: { kind: "route", route: "/arcade/skull-path" } },
      // The CRT + console (far right) → Skull Haven (also reachable in the right view).
      { id: "a_console", caption: "Skull Haven", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.7, glowMax: 0.5, x: 0.87, y: 0.37, w: 0.13, h: 0.1, action: { kind: "route", route: "/arcade/skull-haven" } },
      // Fire exit + SOS booth = the urge flow.
      { id: "a_exit", caption: "I need help now", kind: "glow", tint: "warm", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.45, x: 0.52, y: 0.21, w: 0.16, h: 0.4, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "a_sos", caption: "I need help now", kind: "glow", tint: "warm", interaction: "object", haptic: "heavy", glowMax: 0.5, x: 0.78, y: 0.23, w: 0.12, h: 0.15, action: { kind: "route", route: "/session/urge", warn: true } },
    ],
  },
  arcade_right: {
    id: "arcade_right",
    title: "The Arcade",
    image: require("../../assets/scenes/arcade_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "arcade",
    back: "right",
    hotspots: [
      // The CRT + PS2 (centre) → Skull Haven.
      { id: "ar_console", caption: "Skull Haven", kind: "glow", tint: "warm", interaction: "object", haptic: "medium", glowScale: 0.7, glowMax: 0.5, x: 0.43, y: 0.36, w: 0.19, h: 0.12, action: { kind: "route", route: "/arcade/skull-haven" } },
      // Fire exit + SOS booth = the urge flow.
      { id: "ar_exit", caption: "I need help now", kind: "glow", tint: "warm", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.45, x: 0.08, y: 0.18, w: 0.16, h: 0.42, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "ar_sos", caption: "I need help now", kind: "glow", tint: "warm", interaction: "object", haptic: "heavy", glowMax: 0.5, x: 0.28, y: 0.24, w: 0.12, h: 0.15, action: { kind: "route", route: "/session/urge", warn: true } },
      // The Bar door (right) → the Café-Bar (arcade ↔ bar connection).
      { id: "ar_bar", caption: "Café-Bar", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.5, x: 0.78, y: 0.18, w: 0.2, h: 0.5, action: { kind: "node", node: "cafebar" } },
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
      // Recommendations — the drawn 4-postit corkboard (0.0 alcohol-free swaps).
      // The whole board is the tap target; the labels below sit on the drawn
      // postits (type per postit) plus a "bar line" call to action. Positioned
      // in the editor onto the base art.
      { id: "s_recommendations", caption: "Recommendations", kind: "plain", interaction: "destination", x: 0.174, y: 0.213, w: 0.334, h: 0.117, action: { kind: "route", route: "/support/recommendations" } },
      { id: "s_rec_beer", caption: "Beer", kind: "label", label: "Beer", labelSize: 11, interaction: "destination", rotate: -23, rotateX: 2, x: 0.168, y: 0.224, w: 0.14, h: 0.035, action: { kind: "route", route: "/support/recommendations" } },
      { id: "s_rec_wine", caption: "Wine", kind: "label", label: "Wine", labelSize: 11, interaction: "destination", rotate: -23, rotateY: 2, x: 0.263, y: 0.236, w: 0.162, h: 0.042, action: { kind: "route", route: "/support/recommendations" } },
      { id: "s_rec_spirits", caption: "Spirits", kind: "label", label: "Spirits", labelSize: 9, interaction: "destination", rotate: -23, rotateY: 2, x: 0.195, y: 0.282, w: 0.15, h: 0.035, action: { kind: "route", route: "/support/recommendations" } },
      { id: "s_rec_cider", caption: "Cider", kind: "label", label: "Cider", labelSize: 10, interaction: "destination", rotate: -23, rotateY: 2, x: 0.336, y: 0.291, w: 0.14, h: 0.035, action: { kind: "route", route: "/support/recommendations" } },
      { id: "s_rec_ask", caption: "Ask for recommendations", kind: "label", label: "Ask for Recommendations!", labelSize: 10, interaction: "destination", rotate: 4, rotateY: -12, x: 0.151, y: 0.179, w: 0.34, h: 0.035, action: { kind: "route", route: "/support/recommendations" } },
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
      // My Sky — the window shows a live preview of your real constellation
      // (SkyInlay), and tapping it opens the full sky. No glow blob; the inlay is
      // the whole point of the big window. The label sits on top.
      { id: "mf_sky", caption: "My Sky", kind: "board", inlay: "sky", interaction: "destination", haptic: "light", opacity: 0.2, x: 0.107, y: 0.12, w: 0.802, h: 0.483, action: { kind: "route", route: "/constellation" } },
      { id: "mf_lbl_sky", caption: "My Sky", kind: "label", label: "My Sky", labelSize: 16, opacity: 0.9, x: 0.212, y: 0.273, w: 0.597, h: 0.269, action: { kind: "route", route: "/constellation" } },
      // AI Coach — the armchair (same coach as Support).
      { id: "mf_coach", caption: "AI Coach", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.5, glowMax: 0.6, x: 0.008, y: 0.582, w: 0.134, h: 0.071, action: { kind: "route", route: "/support/coach" } },
      { id: "mf_lbl_coach", caption: "AI Coach", kind: "label", label: "AI Coach", labelSize: 14, rotate: -9, x: 0.022, y: 0.653, w: 0.24, h: 0.05 },
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
      { id: "ml_profile", caption: "Personal file", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.35, glowMax: 0.45, x: -0.058, y: 0.246, w: 0.24, h: 0.48, action: { kind: "route", route: "/profile/file" } },
      { id: "ml_lbl_profile", caption: "Personal file", kind: "label", label: "Personal file", labelSize: 11, rotate: 3, x: 0.002, y: 0.311, w: 0.2, h: 0.05 },
      // Your moments — the corkboard.
      { id: "ml_moments", caption: "Your moments", kind: "board", tint: "purple", interaction: "destination", haptic: "light", inlay: "moments", rotate: 4, rotateY: 36, x: 0.315, y: 0.266, w: 0.302, h: 0.137, action: { kind: "route", route: "/moments" } },
      { id: "ml_lbl_moments", caption: "Your moments", kind: "label", label: "Your moments", labelSize: 13, rotate: 7, x: 0.315, y: 0.238, w: 0.28, h: 0.05 },
      // Looking forward to — the purple notebook on the desk.
      { id: "ml_goals", caption: "Looking forward to", kind: "glow", tint: "warm", interaction: "destination", haptic: "light", glowScale: 0.5, glowMax: 0.75, x: 0.283, y: 0.48, w: 0.14, h: 0.05, action: { kind: "route", route: "/goals" } },
      { id: "ml_lbl_goals", caption: "Looking forward to", kind: "label", label: "Looking forward to", labelSize: 12, x: 0.214, y: 0.423, w: 0.305, h: 0.071 },
      // Circumstances now lives inside the Personal File folder (the locker),
      // so the desk-drawer duplicate is removed.
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
      { id: "mr_tonight", caption: "Tonight", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.6, x: 0.276, y: 0.475, w: 0.225, h: 0.083, action: { kind: "route", route: "/session/track" } },
      { id: "mr_lbl_tonight", caption: "Tonight", kind: "label", label: "Tonight", labelSize: 14, x: 0.27, y: 0.479, w: 0.22, h: 0.05 },
      // Care team + Trusted person — the bed (your human safety net).
      { id: "mr_care", caption: "Care team", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.5, x: 0.537, y: 0.22, w: 0.456, h: 0.208, action: { kind: "route", route: "/profile/care-team" } },
      { id: "mr_lbl_care", caption: "Care team", kind: "label", label: "Care team", labelSize: 17, rotate: -12, rotateY: -18, x: 0.635, y: 0.219, w: 0.26, h: 0.05 },
      { id: "mr_trusted", caption: "Trusted person", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.5, x: 0.619, y: 0.504, w: 0.287, h: 0.071, action: { kind: "route", route: "/profile/trusted" } },
      { id: "mr_lbl_trusted", caption: "Trusted person", kind: "label", label: "Trusted person", labelSize: 14, x: 0.624, y: 0.517, w: 0.32, h: 0.05 },
      // Saved — the bedside drawers (your favourites stash).
      { id: "mr_saved", caption: "Saved", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.6, x: 0.026, y: 0.558, w: 0.33, h: 0.041, action: { kind: "route", route: "/saved" } },
      { id: "mr_lbl_saved", caption: "Saved", kind: "label", label: "Saved", labelSize: 14, rotate: 16, x: 0.078, y: 0.568, w: 0.2, h: 0.05 },
    ],
  },

  // The Café-Bar — mocktails you can make at home. A 2-view room, entered from
  // the café's right counter (and the arcade's CAFE-BAR door); turn left for the
  // mixing station. The back arrow exits to the café.
  // The Café-Bar — now a front + RIGHT room, entered from the lobby's right
  // view (rt_cafebar → here). Front = the old left view's menu (Cinnamon /
  // Mojito / Golden); pan right for the old front's menu (Sunrise / Honey /
  // Slow Tea) + the 0.0 recommendations and the French doors to the garden.
  // SOS booth + fire exit = the urge flow in both views. All boxes rough —
  // drag onto their objects in the editor and export.
  cafebar: {
    id: "cafebar",
    title: "Café-Bar",
    image: require("../../assets/scenes/cafebar_front.png"),
    imgW: 839,
    imgH: 1875,
    fit: "screen",
    right: "cafebar_right",
    // Back → the right corridor you entered from (home-right), not the lobby.
    back: "right",
    hotspots: [
      // The board — drinks (Cinnamon / Mojito / Golden). Each opens its recipe.
      // The whole menu board = one tap → the drinks menu (rough box, re-tune).
      { id: "cb_menu", caption: "The bar menu", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.4, x: 0.56, y: 0.21, w: 0.3, h: 0.11, action: { kind: "route", route: "/bar/menu" } },
      // Coordinates placed in-app and exported. Drink labels (cb_d1–3) removed —
      // the menu board is now one tap (above).
      { id: "cb_arcade", caption: "Arcade", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.4, x: 0.017, y: 0.216, w: 0.104, h: 0.312, action: { kind: "node", node: "arcade" } },
      // SOS booth + fire exit = the urge flow.
      { id: "cb_urge_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "object", haptic: "heavy", glowMax: 0.32, x: 0.13, y: 0.265, w: 0.11, h: 0.13, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "cb_urge_exit", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.4, x: 0.244, y: 0.252, w: 0.124, h: 0.236, action: { kind: "route", route: "/session/urge", warn: true } },
    ],
  },
  cafebar_right: {
    id: "cafebar_right",
    title: "Café-Bar",
    image: require("../../assets/scenes/cafebar_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "cafebar",
    back: "right",
    hotspots: [
      // The whole menu board = one tap → the drinks menu (rough box, re-tune).
      { id: "cbr_menu", caption: "The bar menu", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.4, x: 0.0, y: 0.17, w: 0.36, h: 0.16, action: { kind: "route", route: "/bar/menu" } },
      // Coordinates placed in-app and exported. Drink + recs labels removed —
      // the menu board is now one tap (above). The 0.0 menu also carries the
      // recommendations, so the alcohol-free sign below is a second way to it.
      // The "Alcohol-free 0.0%" sign on the counter → the 0.0 recommendations.
      { id: "cbr_free", caption: "0.0 recommendations", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.6, glowMax: 0.55, x: 0.28, y: 0.37, w: 0.13, h: 0.07, action: { kind: "route", route: "/support/recommendations" } },
      // SOS booth + fire exit = the urge flow.
      { id: "cbr_urge_exit", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.4, x: 0.525, y: 0.245, w: 0.135, h: 0.241, action: { kind: "route", route: "/session/urge", warn: true } },
      { id: "cbr_urge_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "object", haptic: "heavy", glowMax: 0.37, x: 0.671, y: 0.267, w: 0.121, h: 0.13, action: { kind: "route", route: "/session/urge", warn: true } },
      // The French doors → the garden (Outside), which opens onto the grounds.
      { id: "cbr_doors", caption: "The garden", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.4, x: 0.8, y: 0.18, w: 0.2, h: 0.45, action: { kind: "node", node: "outside" } },
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
      // The chalkboard → Community. The vending machine is now just scenery.
      { id: "br_board", caption: "Community", kind: "board", tint: "purple", interaction: "destination", inlay: "community_board", haptic: "light", glowScale: 0.7, glowMax: 0.5, x: 0.463, y: 0.309, w: 0.359, h: 0.131, action: { kind: "route", route: "/community" } },
      { id: "br_lbl_board", caption: "Community", kind: "label", label: "Community", labelSize: 18, x: 0.525, y: 0.246, w: 0.355, h: 0.078 },
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
      // The table → Mentors.
      { id: "brr_table", caption: "Mentors", kind: "glow", tint: "purple", interaction: "destination", haptic: "light", glowScale: 0.7, glowMax: 0.5, x: 0.16, y: 0.394, w: 0.654, h: 0.098, action: { kind: "route", route: "/support/mentors" } },
      { id: "brr_lbl_mentors", caption: "Mentors", kind: "label", label: "Mentors", labelSize: 18, x: 0.386, y: 0.421, w: 0.2, h: 0.08 },
      // The wall → Care team + Trusted person (the human safety net, together).
      { id: "brr_wall", caption: "Care team & sponsor", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.6, glowMax: 0.5, x: 0.3, y: 0.19, w: 0.34, h: 0.16, action: { kind: "route", route: "/profile/connections" } },
      { id: "brr_lbl_wall", caption: "Care team & trusted person", kind: "label", label: "Care Team & Trusted Person", labelSize: 14, rotateY: -10, x: 0.336, y: 0.218, w: 0.26, h: 0.05 },
      // The door → "outside": the wider-life stuff (struggling with something else).
      { id: "brr_door", caption: "Outside", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.4, glowMax: 0.6, x: 0.866, y: 0.32, w: 0.104, h: 0.047, action: { kind: "node", node: "outside" } },
      { id: "brr_lbl_door", caption: "Outside", kind: "label", label: "Outside", labelSize: 13, rotate: -3, x: 0.763, y: 0.174, w: 0.22, h: 0.05 },
    ],
  },

  // The outdoor space — "outside" from the Break Room, now redrawn as the
  // threshold of the grounds. Two doors under the lamp: the Café door leads back
  // inside (the Break Room), and the Reception door is the gate to the shared
  // reception — where the other apps (Cannano and the rest) will live. All the
  // signage ("Café", "Reception", "Struggling with something else too?") is
  // baked into the art, so the only hotspots are the two door glows.
  outside: {
    id: "outside",
    title: "Outside",
    image: require("../../assets/scenes/outside.webp"),
    imgW: 840,
    imgH: 1872,
    fit: "screen",
    // Back → the right view (you came out through its garden window). The Break
    // Room door (brr_door → outside) stays as a second, scenic way in.
    back: "right",
    hotspots: [
      // The Café door (left) → back inside, to the Break Room. (editor-tuned)
      { id: "out_cafe", caption: "Café", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.45, glowMax: 0.55, anchor: { x: 0.83, y: 0.53 }, x: 0.011, y: 0.264, w: 0.23, h: 0.3, action: { kind: "node", node: "breakroom" } },
      // The Reception door (centre) → the shared reception (the grounds). (editor-tuned)
      { id: "out_reception", caption: "Reception", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.45, glowMax: 0.55, anchor: { x: 0.8, y: 0.55 }, x: 0.365, y: 0.273, w: 0.25, h: 0.3, action: { kind: "node", node: "reception" } },
    ],
  },

  // The shared reception — the civic heart of the grounds, drawn from the
  // Alchono viewpoint (you're standing on the purple Alchono mat; your own door
  // is behind you). Each coloured door is a sibling app, its name on a baked-in
  // brass plate. None are built yet, so every door — and the central desk board
  // — opens "The Grounds" directory, which carries the ethos, each room's
  // open/coming-soon status, and (later) the real download/open links. When an
  // app ships, wire its door straight to its store link. The directory lives at
  // /ecosystem ("The Grounds"). Door boxes are rough — drag each onto its door
  // in the editor and export. back → outside.
  reception: {
    id: "reception",
    title: "Reception",
    image: require("../../assets/scenes/reception.webp"),
    imgW: 941,
    imgH: 1672,
    fit: "screen",
    back: "outside",
    hotspots: [
      // New art, doors reordered chronologically L→R: Cocaine, Cannabis,
      // Nicotine, Prescription. Crests baked onto the doors, so just the four
      // glows + the board. Rough boxes — relocate in the editor and export.
      { id: "rc_cocaine", caption: "Cocaine · Cocano — step inside", kind: "glow", tint: "purple", interaction: "destination", glowScale: 0.4, glowMax: 0.4, anchor: { x: 0.5, y: 0.5 }, x: 0.03, y: 0.17, w: 0.14, h: 0.23, action: { kind: "node", node: "cocano_preview" } },
      { id: "rc_cannabis", caption: "Cannabis · Cannano — step inside", kind: "glow", tint: "purple", interaction: "destination", glowScale: 0.4, glowMax: 0.4, anchor: { x: 0.5, y: 0.5 }, x: 0.26, y: 0.17, w: 0.14, h: 0.22, action: { kind: "node", node: "cannano_preview" } },
      { id: "rc_nicotine", caption: "Nicotine · Nicono — step inside", kind: "glow", tint: "purple", interaction: "destination", glowScale: 0.4, glowMax: 0.4, anchor: { x: 0.5, y: 0.5 }, x: 0.61, y: 0.16, w: 0.14, h: 0.23, action: { kind: "node", node: "nicono_preview" } },
      { id: "rc_prescription", caption: "Prescription medication · Medano — step inside", kind: "glow", tint: "purple", interaction: "destination", glowScale: 0.4, glowMax: 0.4, anchor: { x: 0.5, y: 0.5 }, x: 0.83, y: 0.16, w: 0.15, h: 0.25, action: { kind: "node", node: "medano_preview" } },
      // The central corkboard → "The Grounds" directory.
      { id: "rc_board", caption: "The Grounds", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.55, glowMax: 0.45, x: 0.44, y: 0.19, w: 0.17, h: 0.15, action: { kind: "route", route: "/ecosystem" } },
    ],
  },

  // Sibling-app previews — walk through a reception door into a feel of that
  // app's home. Everything is scenery (the boards and shelves are dressed in
  // the art, not wired); only the front counter is live — the "get this app"
  // CTA. It points at /ecosystem ("The Grounds") for now; swap it for the
  // app's store link once it ships. back → reception. Counter boxes are rough
  // — drag onto the desk in the editor and export. Each is the other app's
  // viewpoint, so its own purple/green/etc. is baked into the art.
  cannano_preview: {
    id: "cannano_preview",
    title: "Cannano",
    image: require("../../assets/scenes/cannano_preview.webp"),
    imgW: 851,
    imgH: 1848,
    fit: "screen",
    back: "reception",
    hotspots: [
      // 2008-12 media-club art; Cannano crest framed on the corkboard (top-
      // left). Glow over it → get the app. Rough box — re-tune.
      { id: "cn_emblem", caption: "Get Cannano", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.5, glowMax: 0.4, x: 0.0, y: 0.18, w: 0.17, h: 0.16, action: { kind: "route", route: "/ecosystem" } },
    ],
  },

  cocano_preview: {
    id: "cocano_preview",
    title: "Cocano",
    image: require("../../assets/scenes/cocano_preview.webp"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    back: "reception",
    hotspots: [
      // New 2003-07 internet-café art; the Cocano crest is framed as wall art
      // (top-left). Glow sits over it → get the app. Rough box — re-tune.
      { id: "co_emblem", caption: "Get Cocano", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.5, glowMax: 0.4, x: 0.19, y: 0.17, w: 0.18, h: 0.15, action: { kind: "route", route: "/ecosystem" } },
    ],
  },

  medano_preview: {
    id: "medano_preview",
    title: "Medano",
    image: require("../../assets/scenes/medano_preview.webp"),
    imgW: 853,
    imgH: 1844,
    fit: "screen",
    back: "reception",
    hotspots: [
      // 2018-22 two-storey wellbeing-library art; Medano snake crest framed on
      // the left wall. Glow over it → get the app. Rough box — re-tune.
      { id: "md_emblem", caption: "Get Medano", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.5, glowMax: 0.4, x: 0.0, y: 0.29, w: 0.17, h: 0.17, action: { kind: "route", route: "/ecosystem" } },
    ],
  },

  nicono_preview: {
    id: "nicono_preview",
    title: "Nicono",
    image: require("../../assets/scenes/nicono_preview.webp"),
    imgW: 853,
    imgH: 1844,
    fit: "screen",
    back: "reception",
    hotspots: [
      // 2013-17 workshop art; Nicono moth crest framed as wall art (centre,
      // under the sign). Glow over it → get the app. Rough box — re-tune.
      { id: "ni_emblem", caption: "Get Nicono", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.5, glowMax: 0.4, x: 0.4, y: 0.21, w: 0.2, h: 0.14, action: { kind: "route", route: "/ecosystem" } },
    ],
  },
};
