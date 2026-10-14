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
  | { kind: "node"; node: string }
  // The urge sanctuary. "walk" steps you in through the fire-exit canopy and
  // lets you stroll the path (a hard day); "jump" fades you straight through
  // the canopy to the clearing, no decisions (a craving). Both from any screen.
  | { kind: "forest"; mode: "walk" | "jump" };

export type HotspotKind =
  | "label" // environmental signage — text only, NOT tappable
  | "glow" // interactive object — a soft breathing light bloom, no text
  | "primary" // the dominant immediate-help action (the urge sign)
  | "board" // (legacy) interactive chalk label — text + tap
  | "sign" // (legacy) interactive sign — text + tap
  | "sticker" // a hand-drawn taped paper room-sign (wayfinding doodle)
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
  /** A taped paper room-sign doodle shown filling this box (keyed into STICKERS).
   *  Pointer-transparent like an inlay, so a tap still routes via `action`. Used
   *  for hand-drawn wayfinding near doors/stairs. */
  sticker?: string;
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
  /** Optional night version of `image`, same composition + size (so hotspot
   *  coordinates are shared). The engine loads it from 7pm–7am; falls back to
   *  the day `image` when there's no night frame yet. */
  nightImage?: ImageSourcePropType;
  imgW: number;
  imgH: number;
  fit: "tall" | "screen";
  hotspots: Hotspot[];
  left?: string;
  right?: string;
  back?: string;
  placeholder?: boolean;
};

export const HUB_START = "living_room_front";

export const HUB_NODES: Record<string, HubNode> = {
  // No decisions on the way in. The SOS "jump" fades straight through the
  // canopy to the clearing; the fire-exit "walk" drops you at the canopy to
  // stroll the path yourself. Back unwinds however you came (a walk retraces
  // the path; a jump drops you back where you were). `back` here is only the
  // safety fallback — the engine's history trail is what normally drives it.
  // A resources folder (extra human support) rides along in the engine with a
  // first-time haptic + hint. Phase 1 is navigable + still; the living water,
  // particles and build-your-world come in later phases.
  forest_canopy: {
    id: "forest_canopy",
    title: "The Woods",
    image: require("../../assets/scenes/forest_canopy.png"),
    nightImage: require("../../assets/scenes/forest_canopy_night.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    back: "living_room_front",
    hotspots: [
      // The lit path up through the trees → deeper in. (Rough box — tune in-app.)
      { id: "fc_path", caption: "Into the woods", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.4, x: 0.37, y: 0.42, w: 0.26, h: 0.3, action: { kind: "node", node: "forest_hall" } },
    ],
  },
  forest_hall: {
    id: "forest_hall",
    title: "The Woods",
    image: require("../../assets/scenes/forest_hall.png"),
    nightImage: require("../../assets/scenes/forest_hall_night.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    back: "forest_canopy",
    hotspots: [
      // The path toward the opening → the clearing. (Rough box — tune in-app.)
      { id: "fh_path", caption: "Towards the clearing", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.4, x: 0.4, y: 0.4, w: 0.3, h: 0.34, action: { kind: "node", node: "clearing_front" } },
    ],
  },

  // The clearing — a 3-view sanctuary by the river. Front = arrival (camp +
  // river on the left); turn left for the river/dock (the houseboat berth
  // later), right for the big trees (treehouse) + the meadow path. Build-your-
  // world and the "alive" water come in later phases; for now it's a place you
  // stand in. No urge hotspots here — you're already out.
  clearing_front: {
    id: "clearing_front",
    title: "The Clearing",
    image: require("../../assets/scenes/clearing_front.png"),
    nightImage: require("../../assets/scenes/clearing_front_night.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "clearing_left",
    right: "clearing_right",
    back: "living_room_front",
    hotspots: [],
  },
  clearing_left: {
    id: "clearing_left",
    title: "The River",
    image: require("../../assets/scenes/clearing_left.png"),
    nightImage: require("../../assets/scenes/clearing_left_night.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    right: "clearing_front",
    back: "clearing_front",
    hotspots: [],
  },
  clearing_right: {
    id: "clearing_right",
    title: "The Clearing",
    image: require("../../assets/scenes/clearing_right.png"),
    nightImage: require("../../assets/scenes/clearing_right_night.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "clearing_front",
    back: "clearing_front",
    hotspots: [],
  },

  // === THE CABIN (home, not reception) ======================================
  // A real two-floor house of discrete rooms behind signed doors — the doodle on
  // each door IS the wayfinding (controller = games, mug = kitchen, bed = your
  // room, toilet = bathroom). You SIT in each room (first-person "using the
  // house", so a sofa/blanket fills the foreground) and look around its own three
  // views (front + left/right pans). DOWNSTAIRS: the living room (home/start),
  // with doors to the games room, the kitchen, out to the woods (the glass front
  // door), and up the stairs. UPSTAIRS: the stairs land on a LANDING, whose doors
  // open the study, your room, and the single-view bathroom.
  //
  // Only the connective navigation (doors, stairs, pans, Back) is baked here, and
  // the door coordinates were read off the art by eye — nudge them onto the exact
  // doors in the editor. Every FEATURE hotspot (goals, the computer, the games,
  // the drinks menu...) and the "need a minute?" keys get placed in the editor.

  // --- Downstairs: Living Room (home / start) ------------------------------
  living_room_front: {
    id: "living_room_front",
    title: "Living Room",
    image: require("../../assets/scenes/living_room_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "living_room_left",
    right: "living_room_right",
    hotspots: [
      { id: "lrf_door_entertainment", caption: "Games room", kind: "glow", interaction: "destination", haptic: "medium", x: 0.13, y: 0.23, w: 0.18, h: 0.40, action: { kind: "node", node: "entertainment_front" } },
      { id: "lrf_door_kitchen", caption: "Kitchen", kind: "glow", interaction: "destination", haptic: "medium", x: 0.70, y: 0.23, w: 0.19, h: 0.40, action: { kind: "node", node: "kitchen_front" } },
    ],
  },
  living_room_left: {
    id: "living_room_left",
    title: "Living Room",
    image: require("../../assets/scenes/living_room_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "living_room_front",
    back: "living_room_front",
    hotspots: [
      { id: "lrl_door_entertainment", caption: "Games room", kind: "glow", interaction: "destination", haptic: "medium", x: 0.85, y: 0.28, w: 0.15, h: 0.42, action: { kind: "node", node: "entertainment_front" } },
    ],
  },
  living_room_right: {
    id: "living_room_right",
    title: "Living Room",
    image: require("../../assets/scenes/living_room_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "living_room_front",
    back: "living_room_front",
    hotspots: [
      { id: "lrr_door_woods", caption: "Out to the woods", kind: "glow", interaction: "destination", haptic: "medium", x: 0.27, y: 0.19, w: 0.25, h: 0.40, action: { kind: "forest", mode: "walk" } },
      { id: "lrr_stairs", caption: "Upstairs", kind: "glow", interaction: "destination", haptic: "medium", x: 0.63, y: 0.16, w: 0.35, h: 0.52, action: { kind: "node", node: "landing_front" } },
      { id: "lrr_door_kitchen", caption: "Kitchen", kind: "glow", interaction: "destination", haptic: "medium", x: 0.0, y: 0.22, w: 0.14, h: 0.42, action: { kind: "node", node: "kitchen_front" } },
    ],
  },

  // --- Downstairs: Games Room ----------------------------------------------
  entertainment_left: {
    id: "entertainment_left", title: "Games Room",
    image: require("../../assets/scenes/entertainment_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "entertainment_front", back: "living_room_front",
    hotspots: [],
  },
  entertainment_front: {
    id: "entertainment_front", title: "Games Room",
    image: require("../../assets/scenes/entertainment_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "entertainment_left", right: "entertainment_right", back: "living_room_front",
    hotspots: [],
  },
  entertainment_right: {
    id: "entertainment_right", title: "Games Room",
    image: require("../../assets/scenes/entertainment_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "entertainment_front", back: "living_room_front",
    hotspots: [],
  },

  // --- Downstairs: Kitchen -------------------------------------------------
  kitchen_left: {
    id: "kitchen_left", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "kitchen_front", back: "living_room_front",
    hotspots: [],
  },
  kitchen_front: {
    id: "kitchen_front", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "kitchen_left", right: "kitchen_right", back: "living_room_front",
    hotspots: [],
  },
  kitchen_right: {
    id: "kitchen_right", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "kitchen_front", back: "living_room_front",
    hotspots: [],
  },

  // --- Upstairs: Landing (where the stairs land) ---------------------------
  landing_front: {
    id: "landing_front", title: "Landing",
    image: require("../../assets/scenes/landing_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "landing_left", right: "landing_right", back: "living_room_front",
    hotspots: [
      { id: "ldf_door_study", caption: "Study", kind: "glow", interaction: "destination", haptic: "medium", x: 0.33, y: 0.21, w: 0.30, h: 0.44, action: { kind: "node", node: "study_front" } },
      { id: "ldf_door_room", caption: "Your room", kind: "glow", interaction: "destination", haptic: "medium", x: 0.0, y: 0.22, w: 0.12, h: 0.42, action: { kind: "node", node: "me_room_front" } },
    ],
  },
  landing_left: {
    id: "landing_left", title: "Landing",
    image: require("../../assets/scenes/landing_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "landing_front", back: "living_room_front",
    hotspots: [
      { id: "ldl_door_room", caption: "Your room", kind: "glow", interaction: "destination", haptic: "medium", x: 0.37, y: 0.21, w: 0.33, h: 0.45, action: { kind: "node", node: "me_room_front" } },
    ],
  },
  landing_right: {
    id: "landing_right", title: "Landing",
    image: require("../../assets/scenes/landing_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "landing_front", back: "living_room_front",
    hotspots: [
      { id: "ldr_door_bathroom", caption: "Bathroom", kind: "glow", interaction: "destination", haptic: "medium", x: 0.27, y: 0.17, w: 0.35, h: 0.52, action: { kind: "node", node: "bathroom" } },
    ],
  },

  // --- Upstairs: Study (read / write / reach out) --------------------------
  study_left: {
    id: "study_left", title: "Study",
    image: require("../../assets/scenes/study_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "study_front", back: "landing_front",
    hotspots: [],
  },
  study_front: {
    id: "study_front", title: "Study",
    image: require("../../assets/scenes/study_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "study_left", right: "study_right", back: "landing_front",
    hotspots: [],
  },
  study_right: {
    id: "study_right", title: "Study",
    image: require("../../assets/scenes/study_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "study_front", back: "landing_front",
    hotspots: [],
  },

  // --- Upstairs: Your Room -------------------------------------------------
  me_room_left: {
    id: "me_room_left", title: "Your Room",
    image: require("../../assets/scenes/me_room_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "me_room_front", back: "landing_front",
    hotspots: [],
  },
  me_room_front: {
    id: "me_room_front", title: "Your Room",
    image: require("../../assets/scenes/me_room_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "me_room_left", right: "me_room_right", back: "landing_front",
    hotspots: [],
  },
  me_room_right: {
    id: "me_room_right", title: "Your Room",
    image: require("../../assets/scenes/me_room_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "me_room_front", back: "landing_front",
    hotspots: [],
  },

  // --- Upstairs: Bathroom (single view) ------------------------------------
  // Open the door, glance in, the keys are there if you need them. Nothing to do
  // on the toilet, so it doesn't earn left/right. Back returns to the landing.
  bathroom: {
    id: "bathroom", title: "Bathroom",
    image: require("../../assets/scenes/bathroom_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    back: "landing_front",
    hotspots: [],
  },
};
