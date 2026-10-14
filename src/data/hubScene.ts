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
      { id: "lrf_door_entertainment", caption: "Games room", kind: "glow", interaction: "destination", haptic: "medium", x: 0.146, y: 0.254, w: 0.172, h: 0.096, action: { kind: "node", node: "entertainment_front" } },
      { id: "lrf_door_kitchen", caption: "Kitchen", kind: "glow", interaction: "destination", haptic: "medium", x: 0.771, y: 0.259, w: 0.180, h: 0.091, action: { kind: "node", node: "kitchen_front" } },
      { id: "lrf_goals", caption: "Looking forward to", kind: "glow", tint: "warm", interaction: "object", haptic: "light", x: 0.150, y: 0.593, w: 0.363, h: 0.154, action: { kind: "route", route: "/goals" } },
      { id: "lrf_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.340, y: 0.243, w: 0.122, h: 0.140, action: { kind: "forest", mode: "jump" } },
      { id: "lrf_moments", caption: "Your moments", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "moments", x: 0.461, y: 0.251, w: 0.242, h: 0.121, action: { kind: "route", route: "/moments" } },
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
      { id: "lrl_entertainment", caption: "Games room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.882, y: 0.254, w: 0.208, h: 0.123, action: { kind: "node", node: "entertainment_front" } },
      { id: "lrl_goals", caption: "Looking forward to", kind: "glow", tint: "warm", interaction: "object", haptic: "light", x: 0.702, y: 0.681, w: 0.266, h: 0.121, action: { kind: "route", route: "/goals" } },
      { id: "lrl_recovery", caption: "Recovery", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.270, y: 0.349, w: 0.534, h: 0.136, action: { kind: "route", route: "/support/recovery" } },
      { id: "lrl_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.017, y: 0.274, w: 0.117, h: 0.062, action: { kind: "forest", mode: "jump" } },
      { id: "lrl_keys2", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.015, y: 0.352, w: 0.159, h: 0.140, action: { kind: "forest", mode: "jump" } },
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
      { id: "lrr_woods_title", caption: "Forest walk", kind: "label", label: "Forest Walk", x: 0.305, y: 0.142, w: 0.200, h: 0.080 },
      { id: "lrr_woods", caption: "Out to the woods", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.266, y: 0.110, w: 0.288, h: 0.148, action: { kind: "node", node: "forest_canopy" } },
      { id: "lrr_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.099, y: 0.242, w: 0.160, h: 0.160, action: { kind: "forest", mode: "jump" } },
      { id: "lrr_stairs", caption: "Upstairs", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.653, y: 0.471, w: 0.213, h: 0.106, action: { kind: "node", node: "landing_front" } },
      { id: "lrr_room", caption: "Your room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.696, y: 0.057, w: 0.210, h: 0.099, action: { kind: "node", node: "me_room_front" } },
      { id: "lrr_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: -0.038, y: 0.653, w: 0.225, h: 0.113, action: { kind: "route", route: "/resources/home" } },
    ],
  },

  // --- Downstairs: Games Room ----------------------------------------------
  entertainment_left: {
    id: "entertainment_left", title: "Games Room",
    image: require("../../assets/scenes/entertainment_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "entertainment_front", back: "entertainment_front",
    hotspots: [
      { id: "el_grove", caption: "Skull Grove", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.415, y: 0.390, w: 0.123, h: 0.062, action: { kind: "route", route: "/arcade/skull-grove" } },
      { id: "el_shield", caption: "Growth Shield", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.560, y: 0.399, w: 0.158, h: 0.043, action: { kind: "route", route: "/arcade/growth-shield" } },
      { id: "el_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.322, y: 0.250, w: 0.135, h: 0.129, action: { kind: "forest", mode: "jump" } },
      { id: "el_woods", caption: "Forest walk", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.012, y: 0.355, w: 0.146, h: 0.071, action: { kind: "node", node: "forest_canopy" } },
      { id: "el_woods_title", caption: "Forest walk", kind: "label", label: "Forest Walk", x: 0.086, y: 0.135, w: 0.200, h: 0.080 },
      { id: "el_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.541, y: 0.744, w: 0.467, h: 0.151, action: { kind: "route", route: "/resources/home" } },
      { id: "el_gameboy", caption: "Skull Path", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.869, y: 0.410, w: 0.134, h: 0.074, action: { kind: "route", route: "/arcade/skull-path" } },
    ],
  },
  entertainment_front: {
    id: "entertainment_front", title: "Games Room",
    image: require("../../assets/scenes/entertainment_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "entertainment_left", right: "entertainment_right", back: "living_room_right",
    hotspots: [
      { id: "ef_ps1", caption: "Skull Haven", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.372, y: 0.360, w: 0.284, h: 0.084, action: { kind: "route", route: "/arcade/skull-haven" } },
      { id: "ef_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.226, y: 0.257, w: 0.138, h: 0.116, action: { kind: "forest", mode: "jump" } },
      { id: "ef_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.397, y: 0.741, w: 0.556, h: 0.139, action: { kind: "route", route: "/resources/home" } },
      { id: "ef_livingroom", caption: "Living room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.806, y: 0.327, w: 0.162, h: 0.082, action: { kind: "node", node: "living_room_right" } },
    ],
  },
  entertainment_right: {
    id: "entertainment_right", title: "Games Room",
    image: require("../../assets/scenes/entertainment_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "entertainment_front", back: "entertainment_front",
    hotspots: [
      { id: "er_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.091, y: 0.713, w: 0.481, h: 0.145, action: { kind: "route", route: "/resources/home" } },
      { id: "er_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.488, y: 0.240, w: 0.143, h: 0.134, action: { kind: "forest", mode: "jump" } },
      { id: "er_gameboy", caption: "Skull Path", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.672, y: 0.412, w: 0.194, h: 0.091, action: { kind: "route", route: "/arcade/skull-path" } },
      { id: "er_saved", caption: "Saved", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.591, y: 0.584, w: 0.310, h: 0.080, action: { kind: "route", route: "/saved" } },
    ],
  },

  // --- Downstairs: Kitchen -------------------------------------------------
  kitchen_left: {
    id: "kitchen_left", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "kitchen_front", back: "living_room_right",
    hotspots: [
      { id: "kl_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.610, y: 0.471, w: 0.129, h: 0.077, action: { kind: "route", route: "/session/track" } },
      { id: "kl_zine", caption: "The zine", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "zine", x: 0.466, y: 0.273, w: 0.166, h: 0.110 },
      { id: "kl_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.325, y: 0.337, w: 0.119, h: 0.103, action: { kind: "forest", mode: "jump" } },
      { id: "kl_woods_title", caption: "Forest walk", kind: "label", label: "Forest Walk", x: 0.072, y: 0.098, w: 0.200, h: 0.080, action: { kind: "node", node: "forest_canopy" } },
      { id: "kl_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.426, y: 0.785, w: 0.529, h: 0.140, action: { kind: "route", route: "/resources/home" } },
      { id: "kl_coach", caption: "AI Coach", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.375, y: 0.577, w: 0.167, h: 0.090, action: { kind: "route", route: "/support/coach" } },
    ],
  },
  kitchen_front: {
    id: "kitchen_front", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "kitchen_left", right: "kitchen_right", back: "living_room_right",
    hotspots: [
      { id: "kf_zine", caption: "The zine", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "zine", rotateX: -6, rotateY: -4, x: -0.055, y: 0.278, w: 0.194, h: 0.105 },
      { id: "kf_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.446, y: 0.744, w: 0.538, h: 0.172, action: { kind: "route", route: "/resources/home" } },
      { id: "kf_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.737, y: 0.234, w: 0.207, h: 0.138, action: { kind: "forest", mode: "jump" } },
      { id: "kf_recovery", caption: "Recovery", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.757, y: 0.462, w: 0.189, h: 0.141, action: { kind: "route", route: "/support/recovery" } },
      { id: "kf_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.085, y: 0.468, w: 0.163, h: 0.087, action: { kind: "route", route: "/session/track" } },
    ],
  },
  kitchen_right: {
    id: "kitchen_right", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "kitchen_front", back: "kitchen_front",
    hotspots: [
      { id: "kr_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.219, y: 0.202, w: 0.185, h: 0.195, action: { kind: "forest", mode: "jump" } },
      { id: "kr_woods", caption: "Forest walk", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.524, y: 0.374, w: 0.133, h: 0.059, action: { kind: "node", node: "forest_canopy" } },
      { id: "kr_recommendations", caption: "Recommendations", kind: "label", label: "0,0", rotate: -50, x: 0.679, y: 0.381, w: 0.108, h: 0.082, action: { kind: "route", route: "/support/recommendations" } },
      { id: "kr_mocktails", caption: "Mocktails", kind: "label", label: "Mocktails", labelSize: 11, rotate: -50, x: 0.771, y: 0.385, w: 0.114, h: 0.073, action: { kind: "route", route: "/bar/menu" } },
      { id: "kr_woods_title", caption: "Forest walk", kind: "label", label: "Forest Walk", rotate: -25, rotateY: -28, x: 0.420, y: 0.108, w: 0.200, h: 0.080 },
      { id: "kr_connections", caption: "Your people", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.291, y: 0.459, w: 0.141, h: 0.127, action: { kind: "route", route: "/profile/connections" } },
      { id: "kr_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.038, y: 0.826, w: 0.457, h: 0.114, action: { kind: "route", route: "/resources/home" } },
      { id: "kr_saved", caption: "Saved", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.591, y: 0.480, w: 0.173, h: 0.077, action: { kind: "route", route: "/saved" } },
    ],
  },

  // --- Upstairs: Landing (where the stairs land) ---------------------------
  landing_front: {
    id: "landing_front", title: "Landing",
    image: require("../../assets/scenes/landing_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "landing_left", right: "landing_right", back: "living_room_front",
    hotspots: [
      { id: "ldf_door_study", caption: "Study", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.356, y: 0.344, w: 0.135, h: 0.073, action: { kind: "node", node: "study_front" } },
      { id: "ldf_door_room", caption: "Your room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: -0.020, y: 0.230, w: 0.146, h: 0.102, action: { kind: "node", node: "me_room_front" } },
      { id: "ldf_door_bathroom", caption: "Bathroom", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.909, y: 0.233, w: 0.211, h: 0.098, action: { kind: "node", node: "bathroom" } },
      { id: "ldf_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.189, y: 0.230, w: 0.160, h: 0.160, action: { kind: "forest", mode: "jump" } },
    ],
  },
  landing_left: {
    id: "landing_left", title: "Landing",
    image: require("../../assets/scenes/landing_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "landing_front", back: "landing_front",
    hotspots: [
      { id: "ldl_door_room", caption: "Your room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.476, y: 0.242, w: 0.254, h: 0.125, action: { kind: "node", node: "me_room_front" } },
      { id: "ldl_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.216, y: 0.237, w: 0.198, h: 0.165, action: { kind: "forest", mode: "jump" } },
      { id: "ldl_downstairs", caption: "Downstairs", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.072, y: 0.423, w: 0.192, h: 0.089, action: { kind: "node", node: "living_room_right" } },
    ],
  },
  landing_right: {
    id: "landing_right", title: "Landing",
    image: require("../../assets/scenes/landing_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "landing_front", back: "landing_front",
    hotspots: [
      { id: "ldr_door_bathroom", caption: "Bathroom", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.356, y: 0.254, w: 0.296, h: 0.132, action: { kind: "node", node: "bathroom" } },
      { id: "ldr_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.755, y: 0.242, w: 0.202, h: 0.207, action: { kind: "forest", mode: "jump" } },
      { id: "ldr_study", caption: "Study", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: -0.016, y: 0.418, w: 0.164, h: 0.087, action: { kind: "node", node: "study_right" } },
      { id: "ldr_downstairs", caption: "Downstairs", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.759, y: 0.493, w: 0.200, h: 0.089, action: { kind: "node", node: "living_room_right" } },
    ],
  },

  // --- Upstairs: Study (read / write / reach out) --------------------------
  study_left: {
    id: "study_left", title: "Study",
    image: require("../../assets/scenes/study_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "study_front", back: "study_front",
    hotspots: [
      { id: "sl_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.183, y: 0.247, w: 0.189, h: 0.180, action: { kind: "forest", mode: "jump" } },
      { id: "sl_trusted", caption: "Trusted person", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.296, y: 0.569, w: 0.162, h: 0.077, action: { kind: "route", route: "/profile/trusted" } },
      { id: "sl_coach", caption: "AI Coach", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.632, y: 0.650, w: 0.184, h: 0.080, action: { kind: "route", route: "/support/coach" } },
      { id: "sl_door_room", caption: "Your room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.021, y: 0.424, w: 0.160, h: 0.077, action: { kind: "node", node: "me_room_right" } },
    ],
  },
  study_front: {
    id: "study_front", title: "Study",
    image: require("../../assets/scenes/study_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "study_left", right: "study_right", back: "landing_front",
    hotspots: [
      { id: "sf_computer", caption: "Messages", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "messages", rotateX: 8, x: 0.506, y: 0.480, w: 0.274, h: 0.103, action: { kind: "route", route: "/messages" } },
      { id: "sf_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.687, y: 0.667, w: 0.355, h: 0.117, action: { kind: "route", route: "/resources/home" } },
      { id: "sf_recovery", caption: "Recovery", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.124, y: 0.653, w: 0.416, h: 0.114, action: { kind: "route", route: "/support/recovery" } },
      { id: "sf_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.100, y: 0.427, w: 0.252, h: 0.119, action: { kind: "route", route: "/session/track" } },
      { id: "sf_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.788, y: 0.228, w: 0.193, h: 0.183, action: { kind: "forest", mode: "jump" } },
      { id: "sf_woods", caption: "Forest walk", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: -0.054, y: 0.230, w: 0.350, h: 0.138, action: { kind: "node", node: "forest_hall" } },
    ],
  },
  study_right: {
    id: "study_right", title: "Study",
    image: require("../../assets/scenes/study_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "study_front", back: "study_front",
    hotspots: [
      { id: "sr_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.054, y: 0.222, w: 0.218, h: 0.220, action: { kind: "forest", mode: "jump" } },
      { id: "sr_community", caption: "Community", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "community_board", x: 0.295, y: 0.234, w: 0.514, h: 0.244, action: { kind: "route", route: "/community" } },
      { id: "sr_community2", caption: "Community", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "community", rotate: -1, x: 0.873, y: 0.288, w: 0.108, h: 0.091, action: { kind: "route", route: "/community" } },
      { id: "sr_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.564, y: 0.512, w: 0.254, h: 0.115, action: { kind: "route", route: "/resources/home" } },
      { id: "sr_mentors", caption: "Mentors", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.334, y: 0.517, w: 0.226, h: 0.110, action: { kind: "route", route: "/support/mentors" } },
    ],
  },

  // --- Upstairs: Your Room -------------------------------------------------
  me_room_left: {
    id: "me_room_left", title: "Your Room",
    image: require("../../assets/scenes/me_room_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "me_room_front", back: "me_room_front",
    hotspots: [
      { id: "mrl_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.486, y: 0.200, w: 0.185, h: 0.169, action: { kind: "forest", mode: "jump" } },
      { id: "mrl_file", caption: "Personal file", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.126, y: 0.436, w: 0.492, h: 0.070, action: { kind: "route", route: "/profile/file" } },
      { id: "mrl_saved", caption: "Saved", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.228, y: 0.554, w: 0.352, h: 0.056, action: { kind: "route", route: "/saved" } },
    ],
  },
  me_room_front: {
    id: "me_room_front", title: "Your Room",
    image: require("../../assets/scenes/me_room_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "me_room_left", right: "me_room_right", back: "landing_left",
    hotspots: [
      { id: "mrf_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.014, y: 0.199, w: 0.184, h: 0.184, action: { kind: "forest", mode: "jump" } },
      { id: "mrf_connections", caption: "Your people", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.299, y: 0.429, w: 0.320, h: 0.143, action: { kind: "route", route: "/profile/connections" } },
      { id: "mrf_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.769, y: 0.392, w: 0.165, h: 0.093, action: { kind: "route", route: "/session/track" } },
    ],
  },
  me_room_right: {
    id: "me_room_right", title: "Your Room",
    image: require("../../assets/scenes/me_room_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "me_room_front", back: "me_room_front",
    hotspots: [
      { id: "mrr_woods_title", caption: "Forest walk", kind: "label", label: "Forest Walk", rotate: -6, x: 0.172, y: 0.081, w: 0.200, h: 0.080, action: { kind: "node", node: "forest_canopy" } },
      { id: "mrr_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.469, y: 0.204, w: 0.196, h: 0.183, action: { kind: "forest", mode: "jump" } },
      { id: "mrr_moments", caption: "Your moments", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "moments", rotate: 4, rotateY: 6, rotateX: 2, x: 0.774, y: 0.380, w: 0.134, h: 0.084, action: { kind: "route", route: "/moments" } },
      { id: "mrr_notes", caption: "Your notes", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.595, y: 0.477, w: 0.261, h: 0.109, action: { kind: "route", route: "/journal/notes" } },
    ],
  },

  // --- Upstairs: Bathroom (single view) ------------------------------------
  // Open the door, glance in, the keys are there if you need them. Nothing to do
  // on the toilet, so it doesn't earn left/right. Back returns to the landing.
  bathroom: {
    id: "bathroom", title: "Bathroom",
    image: require("../../assets/scenes/bathroom_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    back: "landing_left",
    hotspots: [],
  },
};
