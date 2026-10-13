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
  // Two floors wired like a real house. DOWNSTAIRS is one panorama you swipe
  // through: entertainment <- living room (home/start) -> kitchen. UPSTAIRS the
  // same: study (where the stairs land) -> your room -> bathroom. The living room
  // holds the only two navigation hotspots: the stairs (up) and the front door
  // (out into the woods = urge flow). Back returns home. Every other view is empty,
  // for you to place feature hotspots in the editor.
  entertainment_left: {
    id: "entertainment_left",
    title: "Entertainment",
    image: require("../../assets/scenes/entertainment_left.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    right: "entertainment_front",
    back: "living_room_front",
    hotspots: [],
  },
  entertainment_front: {
    id: "entertainment_front",
    title: "Entertainment",
    image: require("../../assets/scenes/entertainment_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "entertainment_left",
    right: "entertainment_right",
    back: "living_room_front",
    hotspots: [],
  },
  entertainment_right: {
    id: "entertainment_right",
    title: "Entertainment",
    image: require("../../assets/scenes/entertainment_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "entertainment_front",
    right: "living_room_left",
    back: "living_room_front",
    hotspots: [],
  },
  living_room_left: {
    id: "living_room_left",
    title: "Living Room",
    image: require("../../assets/scenes/living_room_left.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    right: "living_room_front",
    back: "living_room_front",
    hotspots: [
      { id: "lrl_entertainment", caption: "Entertainment", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.3, x: 0.91, y: 0.217, w: 0.081, h: 0.178, action: { kind: "node", node: "entertainment_front" } },
      { id: "lrl_goals", caption: "Looking forward to", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.61, y: 0.365, w: 0.21, h: 0.096, action: { kind: "route", route: "/goals" } },
      { id: "lrl_resources", caption: "Extra support", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.6, x: 0.821, y: 0.503, w: 0.146, h: 0.07, action: { kind: "route", route: "/resources/home" } },
      { id: "lrl_woods", caption: "Into the woods", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.6, x: 0.022, y: 0.474, w: 0.16, h: 0.16, action: { kind: "node", node: "forest_canopy" } },
      { id: "lrl_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.8, glowMax: 0.6, x: 0.764, y: 0.247, w: 0.132, h: 0.062, action: { kind: "forest", mode: "jump" } },
      { id: "lrl_recovery", caption: "Recovery", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.4, x: 0.282, y: 0.357, w: 0.182, h: 0.111, action: { kind: "route", route: "/support/recovery" } },
      { id: "lrl_sos2", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.8, glowMax: 0.4, x: 0.017, y: 0.274, w: 0.117, h: 0.062, action: { kind: "forest", mode: "jump" } },
    ],
  },
  living_room_front: {
    id: "living_room_front",
    title: "Living Room",
    image: require("../../assets/scenes/living_room_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "living_room_left",
    right: "living_room_right",
    hotspots: [
      { id: "lr_upstairs", caption: "Upstairs", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.7, glowMax: 0.4, x: 0.82, y: 0.037, w: 0.158, h: 0.401, action: { kind: "node", node: "study_front" } },
      { id: "lr_outside", caption: "Outside", kind: "glow", tint: "warm", interaction: "destination", haptic: "heavy", glowScale: 0.7, glowMax: 0.4, x: 0.06, y: 0.864, w: 0.873, h: 0.073, action: { kind: "forest", mode: "walk" } },
      { id: "lrf_entertainment", caption: "Entertainment", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.3, x: 0.429, y: 0.196, w: 0.108, h: 0.176, action: { kind: "node", node: "entertainment_front" } },
      { id: "lrf_kitchen", caption: "Kitchen", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.4, x: 0.629, y: 0.215, w: 0.16, h: 0.16, action: { kind: "node", node: "kitchen_left" } },
      { id: "lrf_goals", caption: "Looking forward to", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.4, x: 0.099, y: 0.364, w: 0.228, h: 0.084, action: { kind: "route", route: "/goals" } },
      { id: "lrf_resources", caption: "Extra support", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.369, y: 0.439, w: 0.163, h: 0.068, action: { kind: "route", route: "/resources/home" } },
      { id: "lrf_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.8, glowMax: 0.5, x: 0.311, y: 0.248, w: 0.104, h: 0.04, action: { kind: "forest", mode: "jump" } },
    ],
  },
  living_room_right: {
    id: "living_room_right",
    title: "Living Room",
    image: require("../../assets/scenes/living_room_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "living_room_front",
    right: "kitchen_front",
    back: "living_room_front",
    hotspots: [
      { id: "lrr_study", caption: "Upstairs", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.4, x: 0.485, y: 0.056, w: 0.156, h: 0.162, action: { kind: "node", node: "study_front" } },
      { id: "lrr_kitchen", caption: "Kitchen", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.3, x: 0.147, y: 0.185, w: 0.119, h: 0.197, action: { kind: "node", node: "kitchen_left" } },
      { id: "lrr_entertainment", caption: "Entertainment", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.4, x: 0.006, y: 0.175, w: 0.065, h: 0.197, action: { kind: "node", node: "entertainment_front" } },
      { id: "lrr_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.8, glowMax: 0.5, x: 0.312, y: 0.224, w: 0.116, h: 0.059, action: { kind: "forest", mode: "jump" } },
      { id: "lrr_resources", caption: "Extra support", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.201, y: 0.463, w: 0.172, h: 0.077, action: { kind: "route", route: "/resources/home" } },
      { id: "lrr_recommendations", caption: "Recommendations", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.674, y: 0.348, w: 0.088, h: 0.133, action: { kind: "route", route: "/support/recommendations" } },
      { id: "lrr_bar", caption: "Drinks menu", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.715, y: 0.281, w: 0.298, h: 0.067, action: { kind: "route", route: "/bar/menu" } },
      { id: "lrr_woods", caption: "Into the woods", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.5, x: -0.004, y: 0.555, w: 0.14, h: 0.094, action: { kind: "node", node: "forest_canopy" } },
      { id: "lrr_coach", caption: "AI Coach", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.4, x: 0.79, y: 0.473, w: 0.16, h: 0.16, action: { kind: "route", route: "/support/coach" } },
    ],
  },
  kitchen_left: {
    id: "kitchen_left",
    title: "Kitchen",
    image: require("../../assets/scenes/kitchen_left.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    right: "kitchen_front",
    back: "living_room_front",
    hotspots: [
      { id: "kl_recommendations", caption: "Recommendations", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.413, y: 0.26, w: 0.119, h: 0.141, action: { kind: "route", route: "/support/recommendations" } },
      { id: "kl_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.6, x: 0.352, y: 0.457, w: 0.185, h: 0.068, action: { kind: "route", route: "/resources/home" } },
      { id: "kl_mentors", caption: "Mentors", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.036, y: 0.262, w: 0.301, h: 0.144, action: { kind: "route", route: "/support/mentors" } },
      { id: "kl_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.8, glowMax: 0.5, x: 0.755, y: 0.239, w: 0.117, h: 0.066, action: { kind: "forest", mode: "jump" } },
    ],
  },
  kitchen_front: {
    id: "kitchen_front",
    title: "Kitchen",
    image: require("../../assets/scenes/kitchen_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "kitchen_left",
    right: "kitchen_right",
    back: "living_room_front",
    hotspots: [
      { id: "kf_woods", caption: "Into the woods", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.5, x: 0.904, y: 0.168, w: 0.09, h: 0.3, action: { kind: "node", node: "forest_canopy" } },
      { id: "kf_connections", caption: "Your people", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.71, y: 0.34, w: 0.162, h: 0.039, action: { kind: "route", route: "/profile/connections" } },
      { id: "kf_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.117, y: 0.378, w: 0.15, h: 0.075, action: { kind: "route", route: "/resources/home" } },
      { id: "kf_recommendations", caption: "Recommendations", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.087, y: 0.202, w: 0.115, h: 0.155, action: { kind: "route", route: "/support/recommendations" } },
      { id: "kf_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.8, glowMax: 0.6, x: 0.758, y: 0.239, w: 0.146, h: 0.063, action: { kind: "forest", mode: "jump" } },
    ],
  },
  kitchen_right: {
    id: "kitchen_right",
    title: "Kitchen",
    image: require("../../assets/scenes/kitchen_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "kitchen_front",
    back: "living_room_front",
    hotspots: [
      { id: "kr_woods", caption: "Into the woods", kind: "glow", tint: "warm", interaction: "destination", haptic: "medium", glowScale: 0.8, glowMax: 0.5, x: 0.393, y: 0.179, w: 0.169, h: 0.273, action: { kind: "node", node: "forest_canopy" } },
      { id: "kr_sos", caption: "I need help now", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", glowScale: 0.8, glowMax: 0.5, x: 0.771, y: 0.227, w: 0.15, h: 0.085, action: { kind: "forest", mode: "jump" } },
      { id: "kr_track", caption: "Tonight", kind: "glow", tint: "warm", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.5, x: 0.192, y: 0.337, w: 0.161, h: 0.039, action: { kind: "route", route: "/session/track" } },
      { id: "kr_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", glowScale: 0.8, glowMax: 0.6, x: -0.022, y: 0.474, w: 0.121, h: 0.061, action: { kind: "route", route: "/resources/home" } },
    ],
  },
  study_left: {
    id: "study_left",
    title: "Study",
    image: require("../../assets/scenes/study_left.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    right: "study_front",
    back: "living_room_front",
    hotspots: [],
  },
  study_front: {
    id: "study_front",
    title: "Study",
    image: require("../../assets/scenes/study_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "study_left",
    right: "study_right",
    back: "living_room_front",
    hotspots: [],
  },
  study_right: {
    id: "study_right",
    title: "Study",
    image: require("../../assets/scenes/study_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "study_front",
    right: "me_room_left",
    back: "living_room_front",
    hotspots: [],
  },
  me_room_left: {
    id: "me_room_left",
    title: "Your Room",
    image: require("../../assets/scenes/me_room_left.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "study_right",
    right: "me_room_front",
    back: "living_room_front",
    hotspots: [],
  },
  me_room_front: {
    id: "me_room_front",
    title: "Your Room",
    image: require("../../assets/scenes/me_room_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "me_room_left",
    right: "me_room_right",
    back: "living_room_front",
    hotspots: [],
  },
  me_room_right: {
    id: "me_room_right",
    title: "Your Room",
    image: require("../../assets/scenes/me_room_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "me_room_front",
    right: "bathroom_left",
    back: "living_room_front",
    hotspots: [],
  },
  bathroom_left: {
    id: "bathroom_left",
    title: "Bathroom",
    image: require("../../assets/scenes/bathroom_left.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "me_room_right",
    right: "bathroom_front",
    back: "living_room_front",
    hotspots: [],
  },
  bathroom_front: {
    id: "bathroom_front",
    title: "Bathroom",
    image: require("../../assets/scenes/bathroom_front.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "bathroom_left",
    right: "bathroom_right",
    back: "living_room_front",
    hotspots: [],
  },
  bathroom_right: {
    id: "bathroom_right",
    title: "Bathroom",
    image: require("../../assets/scenes/bathroom_right.png"),
    imgW: 851,
    imgH: 1847,
    fit: "screen",
    left: "bathroom_front",
    back: "living_room_front",
    hotspots: [],
  },
};
