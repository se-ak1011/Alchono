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
  // An external action from a hotspot: a phone call (tel:), a text (sms:) or a
  // website (https:). Used for the tappable lines on a resources close-up (999,
  // Samaritans, Shout…). `internal:/path` instead routes in-app, like a route.
  | { kind: "link"; url: string }
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
  /** Suppress the pencil ring on this hotspot — a purely invisible tap zone, for
   *  covering a drawn title/article in a close-up where a ring per item is noise.
   *  Still tappable; just draws nothing. (`kind: "plain"` implies this too.) */
  noRing?: boolean;
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
      { id: "lrf_resources", caption: "Resources", kind: "glow", tint: "warm", interaction: "object", haptic: "light", x: 0.160, y: 0.603, w: 0.363, h: 0.154, action: { kind: "node", node: "resources_living" } },
      { id: "lrf_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.340, y: 0.243, w: 0.122, h: 0.140, action: { kind: "forest", mode: "jump" } },
      { id: "lrf_moments", caption: "Your moments", kind: "glow", tint: "purple", interaction: "object", haptic: "light", noRing: true, x: 0.476, y: 0.265, w: 0.206, h: 0.106, action: { kind: "route", route: "/moments" } },
      { id: "lrf_hobby", caption: "Hobbies", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.172, y: 0.119, w: 0.194, h: 0.078, action: { kind: "node", node: "hobby_room" } },
      { id: "lrf_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.516, y: 0.190, w: 0.153, h: 0.059, action: { kind: "route", route: "/session/track" } },
      { id: "lrf_exit", caption: "Out the front door", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", noRing: true, x: 0.440, y: 0.420, w: 0.150, h: 0.260, action: { kind: "node", node: "exterior_front" } },
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
      { id: "lrl_goals", caption: "Resources", kind: "glow", tint: "warm", interaction: "object", haptic: "light", x: 0.711, y: 0.690, w: 0.266, h: 0.121, action: { kind: "node", node: "resources_living" } },
      { id: "lrl_recovery", caption: "Recovery", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.669, y: 0.466, w: 0.168, h: 0.117, action: { kind: "route", route: "/support/recovery" } },
      { id: "lrl_keys2", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.023, y: 0.360, w: 0.174, h: 0.117, action: { kind: "forest", mode: "jump" } },
      { id: "lrl_file", caption: "Personal file", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.163, y: 0.510, w: 0.189, h: 0.135, action: { kind: "route", route: "/profile/file" } },
      { id: "lrl_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.104, y: 0.169, w: 0.164, h: 0.082, action: { kind: "route", route: "/session/track" } },
      { id: "lrl_hobby", caption: "Hobbies", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.031, y: 0.273, w: 0.151, h: 0.073, action: { kind: "node", node: "hobby_room" } },
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
      { id: "lrr_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.113, y: 0.266, w: 0.136, h: 0.140, action: { kind: "forest", mode: "jump" } },
      { id: "lrr_stairs", caption: "Upstairs", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", noRing: true, x: 0.653, y: 0.471, w: 0.213, h: 0.106, action: { kind: "node", node: "landing_front" } },
      { id: "lrr_room", caption: "Your room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.699, y: 0.062, w: 0.210, h: 0.099, action: { kind: "node", node: "me_room_front" } },
      { id: "lrr_woods", caption: "Out to the woods", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.418, y: 0.340, w: 0.179, h: 0.090, action: { kind: "node", node: "forest_canopy" } },
      { id: "lrr_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.118, y: 0.186, w: 0.154, h: 0.068, action: { kind: "route", route: "/session/track" } },
      { id: "lrr_kitchen", caption: "Kitchen", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: -0.038, y: 0.205, w: 0.127, h: 0.110, action: { kind: "node", node: "kitchen_right" } },
      { id: "lrr_stairs_tap", caption: "Upstairs", kind: "plain", noRing: true, x: 0.766, y: 0.176, w: 0.218, h: 0.430, action: { kind: "node", node: "landing_front" } },
    ],
  },

  // --- Downstairs: Games Room ----------------------------------------------
  entertainment_left: {
    id: "entertainment_left", title: "Games Room",
    image: require("../../assets/scenes/entertainment_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "entertainment_front", back: "entertainment_front",
    hotspots: [
      { id: "el_grove", caption: "Skull Grove", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.454, y: 0.406, w: 0.270, h: 0.040, action: { kind: "route", route: "/arcade/skull-grove" } },
      { id: "el_shield", caption: "Growth Shield", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "growth_shield", rotate: -2, rotateX: -18, rotateY: -6, x: 0.484, y: 0.346, w: 0.184, h: 0.065, action: { kind: "route", route: "/arcade/growth-shield" } },
      { id: "el_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.322, y: 0.250, w: 0.135, h: 0.129, action: { kind: "forest", mode: "jump" } },
      { id: "el_woods", caption: "Forest walk", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.012, y: 0.355, w: 0.146, h: 0.071, action: { kind: "node", node: "forest_canopy" } },
      { id: "el_woods_title", caption: "Forest walk", kind: "label", label: "Forest Walk", x: 0.086, y: 0.135, w: 0.200, h: 0.080 },
      { id: "el_resources", caption: "Resources", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.541, y: 0.744, w: 0.467, h: 0.151, action: { kind: "node", node: "resources_entertainment" } },
      { id: "el_gameboy", caption: "Skull Path", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.869, y: 0.410, w: 0.134, h: 0.074, action: { kind: "route", route: "/arcade/skull-path" } },
    ],
  },
  entertainment_front: {
    id: "entertainment_front", title: "Games Room",
    image: require("../../assets/scenes/entertainment_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "entertainment_left", right: "entertainment_right", back: "living_room_right",
    hotspots: [
      { id: "ef_ps1", caption: "Skull Haven", kind: "glow", tint: "purple", interaction: "object", haptic: "light", inlay: "skull_haven", x: 0.372, y: 0.360, w: 0.284, h: 0.084, action: { kind: "route", route: "/arcade/skull-haven" } },
      { id: "ef_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.217, y: 0.241, w: 0.146, h: 0.146, action: { kind: "forest", mode: "jump" } },
      { id: "ef_resources", caption: "Resources", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.397, y: 0.741, w: 0.556, h: 0.139, action: { kind: "node", node: "resources_entertainment" } },
      { id: "ef_livingroom", caption: "Living room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.806, y: 0.327, w: 0.162, h: 0.082, action: { kind: "node", node: "living_room_right" } },
      { id: "ef_saved", caption: "Saved", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.244, y: 0.459, w: 0.183, h: 0.072, action: { kind: "route", route: "/saved" } },
      { id: "ef_community", caption: "Community", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.058, y: 0.394, w: 0.135, h: 0.162, action: { kind: "route", route: "/community" } },
      { id: "ef_hobby", caption: "Hobbies", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.620, y: 0.222, w: 0.172, h: 0.083, action: { kind: "node", node: "hobby_room" } },
      { id: "ef_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.420, y: 0.166, w: 0.155, h: 0.084, action: { kind: "route", route: "/session/track" } },
    ],
  },
  entertainment_right: {
    id: "entertainment_right", title: "Games Room",
    image: require("../../assets/scenes/entertainment_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "entertainment_front", back: "entertainment_front",
    hotspots: [
      { id: "er_resources", caption: "Resources", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.091, y: 0.713, w: 0.481, h: 0.145, action: { kind: "node", node: "resources_entertainment" } },
      { id: "er_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.483, y: 0.250, w: 0.124, h: 0.112, action: { kind: "forest", mode: "jump" } },
      { id: "er_saved", caption: "Looking forward", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.591, y: 0.584, w: 0.310, h: 0.080, action: { kind: "route", route: "/goals" } },
      { id: "er_gameboy", caption: "Skull Path", kind: "glow", tint: "purple", interaction: "object", haptic: "light", opacity: 0.5, x: 0.681, y: 0.423, w: 0.192, h: 0.089, action: { kind: "route", route: "/arcade/skull-path" } },
      { id: "er_community", caption: "Community", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.229, y: 0.409, w: 0.272, h: 0.081, action: { kind: "route", route: "/community" } },
      { id: "er_hobby", caption: "Hobbies", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.615, y: 0.262, w: 0.210, h: 0.088, action: { kind: "node", node: "hobby_room" } },
      { id: "er_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.470, y: 0.141, w: 0.213, h: 0.090, action: { kind: "route", route: "/session/track" } },
    ],
  },

  // --- Downstairs: Kitchen -------------------------------------------------
  kitchen_left: {
    id: "kitchen_left", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "kitchen_front", back: "living_room_right",
    hotspots: [
      { id: "kl_track", caption: "Mentors", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.610, y: 0.471, w: 0.129, h: 0.077, action: { kind: "route", route: "/support/mentors" } },
      { id: "kl_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.325, y: 0.337, w: 0.119, h: 0.103, action: { kind: "forest", mode: "jump" } },
      { id: "kl_woods_title", caption: "Forest walk", kind: "label", label: "Forest Walk", x: 0.072, y: 0.098, w: 0.200, h: 0.080, action: { kind: "node", node: "forest_canopy" } },
      { id: "kl_resources", caption: "Resources", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.426, y: 0.785, w: 0.529, h: 0.140, action: { kind: "node", node: "resources_kitchen" } },
      { id: "kl_coach", caption: "AI Coach", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.375, y: 0.577, w: 0.167, h: 0.090, action: { kind: "route", route: "/support/coach" } },
      { id: "kl_moments", caption: "Your moments", kind: "glow", tint: "purple", interaction: "object", haptic: "light", noRing: true, x: 0.466, y: 0.276, w: 0.165, h: 0.106, action: { kind: "route", route: "/moments" } },
      { id: "kl_hobby", caption: "Hobbies", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.478, y: 0.117, w: 0.266, h: 0.094, action: { kind: "node", node: "hobby_room" } },
    ],
  },
  kitchen_front: {
    id: "kitchen_front", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "kitchen_left", right: "kitchen_right", back: "living_room_right",
    hotspots: [
      { id: "kf_resources", caption: "Resources", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.446, y: 0.744, w: 0.538, h: 0.172, action: { kind: "node", node: "resources_kitchen" } },
      { id: "kf_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.737, y: 0.234, w: 0.207, h: 0.138, action: { kind: "forest", mode: "jump" } },
      { id: "kf_recovery", caption: "Recovery", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.757, y: 0.462, w: 0.189, h: 0.141, action: { kind: "route", route: "/support/recovery" } },
      { id: "kf_track", caption: "Mentors", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.085, y: 0.468, w: 0.163, h: 0.087, action: { kind: "route", route: "/support/mentors" } },
      { id: "kf_moments", caption: "Your moments", kind: "plain", noRing: true, x: -0.025, y: 0.280, w: 0.168, h: 0.099 },
      { id: "kf_moments_inlay", caption: "Your moments", kind: "plain", inlay: "moments", noRing: true, x: -0.025, y: 0.280, w: 0.168, h: 0.099 },
      { id: "kf_track_glow", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.450, y: 0.111, w: 0.209, h: 0.081, action: { kind: "route", route: "/session/track" } },
      { id: "kf_hobby", caption: "Hobbies", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.015, y: 0.121, w: 0.271, h: 0.109, action: { kind: "node", node: "hobby_room" } },
    ],
  },
  kitchen_right: {
    id: "kitchen_right", title: "Kitchen",
    image: require("../../assets/scenes/kitchen_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "kitchen_front", back: "kitchen_front",
    hotspots: [
      { id: "kr_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.219, y: 0.202, w: 0.185, h: 0.195, action: { kind: "forest", mode: "jump" } },
      { id: "kr_woods", caption: "Out to the woods", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.524, y: 0.374, w: 0.133, h: 0.059, action: { kind: "node", node: "forest_canopy" } },
      { id: "kr_recommendations", caption: "0.0 favourites", kind: "label", inlay: "note_0_0_beer", label: "0,0", labelSize: 10, rotate: 18, rotateX: 42, rotateY: -22, x: 0.680, y: 0.393, w: 0.093, h: 0.052, action: { kind: "node", node: "zerozero_beer" } },
      { id: "kr_mocktails", caption: "Mocktails", kind: "label", inlay: "note_mocktails", label: "Mocktails", labelSize: 10, rotate: 18, rotateX: 42, rotateY: -22, x: 0.771, y: 0.397, w: 0.103, h: 0.051, action: { kind: "route", route: "/bar/menu" } },
      { id: "kr_woods_title", caption: "Forest walk", kind: "label", label: "Forest Walk", rotate: -25, rotateY: -28, x: 0.420, y: 0.108, w: 0.200, h: 0.080 },
      { id: "kr_connections", caption: "Recovery", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.291, y: 0.459, w: 0.141, h: 0.127, action: { kind: "route", route: "/support/recovery" } },
      { id: "kr_resources", caption: "Resources", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.038, y: 0.826, w: 0.457, h: 0.114, action: { kind: "node", node: "resources_kitchen" } },
      { id: "kr_saved", caption: "Saved", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.772, y: 0.628, w: 0.166, h: 0.047, action: { kind: "route", route: "/saved" } },
      { id: "kr_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.669, y: 0.246, w: 0.155, h: 0.076, action: { kind: "route", route: "/session/track" } },
      { id: "kr_hobby", caption: "Hobbies", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.734, y: 0.115, w: 0.246, h: 0.102, action: { kind: "node", node: "hobby_room" } },
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
      { id: "sl_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.190, y: 0.259, w: 0.181, h: 0.161, action: { kind: "forest", mode: "jump" } },
      { id: "sl_trusted", caption: "Trusted person", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.296, y: 0.569, w: 0.162, h: 0.077, action: { kind: "route", route: "/profile/trusted" } },
      { id: "sl_coach", caption: "AI Coach", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.632, y: 0.650, w: 0.184, h: 0.080, action: { kind: "route", route: "/support/coach" } },
      { id: "sl_door_room", caption: "Your room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.021, y: 0.424, w: 0.160, h: 0.077, action: { kind: "node", node: "me_room_right" } },
      { id: "sl_desk", caption: "", kind: "plain", noRing: true, x: 0.397, y: 0.270, w: 0.260, h: 0.288 },
      { id: "sl_reading", caption: "The bookshelf", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.542, y: 0.227, w: 0.215, h: 0.099, action: { kind: "node", node: "reading_shelf" } },
    ],
  },
  // A CLOSE-UP of the bookshelf (reached from the study) — tap a spine to open
  // that book's real pages (/reading/[cat], its open spread unchanged). Each
  // book is an invisible tap zone (plain + noRing) so there's no ring per spine,
  // just the drawn shelf. Coords are first-pass estimates — nudge onto the
  // spines in the editor. Back returns to the reading nook.
  reading_shelf: {
    id: "reading_shelf", title: "The bookshelf",
    image: require("../../assets/scenes/reading_shelf.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    back: "study_left",
    hotspots: [
      { id: "rsh_in_the_moment", caption: "In the moment", kind: "plain", noRing: true, x: 0.086, y: 0.064, w: 0.092, h: 0.234, action: { kind: "route", route: "/reading/in-the-moment" } },
      { id: "rsh_understand", caption: "Understand", kind: "plain", noRing: true, x: 0.208, y: 0.064, w: 0.098, h: 0.231, action: { kind: "route", route: "/reading/understand" } },
      { id: "rsh_triggers", caption: "Triggers", kind: "plain", noRing: true, x: 0.326, y: 0.063, w: 0.107, h: 0.229, action: { kind: "route", route: "/reading/triggers" } },
      { id: "rsh_planning", caption: "Planning ahead", kind: "plain", noRing: true, x: 0.552, y: 0.364, w: 0.107, h: 0.239, action: { kind: "route", route: "/reading/planning-ahead" } },
      { id: "rsh_stress", caption: "Stress", kind: "plain", noRing: true, x: 0.679, y: 0.364, w: 0.097, h: 0.235, action: { kind: "route", route: "/reading/stress" } },
      { id: "rsh_sleep", caption: "Sleep", kind: "plain", noRing: true, x: 0.800, y: 0.363, w: 0.102, h: 0.237, action: { kind: "route", route: "/reading/sleep" } },
      { id: "rsh_relationships", caption: "Relationships", kind: "plain", noRing: true, x: 0.229, y: 0.672, w: 0.096, h: 0.239, action: { kind: "route", route: "/reading/relationships" } },
      { id: "rsh_identity", caption: "Identity", kind: "plain", noRing: true, x: 0.360, y: 0.677, w: 0.085, h: 0.236, action: { kind: "route", route: "/reading/identity" } },
      { id: "rsh_after_a_slip", caption: "After a slip", kind: "plain", noRing: true, x: 0.465, y: 0.685, w: 0.113, h: 0.230, action: { kind: "route", route: "/reading/after-a-slip" } },
    ],
  },
  study_front: {
    id: "study_front", title: "Study",
    image: require("../../assets/scenes/study_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "study_left", right: "study_right", back: "landing_front",
    hotspots: [
      { id: "sf_computer", caption: "Messages", kind: "glow", tint: "purple", interaction: "object", haptic: "light", rotateX: 8, x: 0.506, y: 0.480, w: 0.274, h: 0.103, action: { kind: "route", route: "/messages" } },
      { id: "sf_resources", caption: "Resources", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.687, y: 0.667, w: 0.355, h: 0.117, action: { kind: "node", node: "resources_study" } },
      { id: "sf_recovery", caption: "Looking forward", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.124, y: 0.653, w: 0.416, h: 0.114, action: { kind: "route", route: "/goals" } },
      { id: "sf_track", caption: "Tonight", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.100, y: 0.427, w: 0.252, h: 0.119, action: { kind: "route", route: "/session/track" } },
      { id: "sf_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.788, y: 0.228, w: 0.193, h: 0.183, action: { kind: "forest", mode: "jump" } },
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
      { id: "sr_resources", caption: "Extra support", kind: "glow", tint: "purple", interaction: "object", haptic: "light", x: 0.564, y: 0.512, w: 0.254, h: 0.115, action: { kind: "node", node: "resources_study" } },
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
      { id: "mrl_landing", caption: "Downstairs", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.692, y: 0.374, w: 0.183, h: 0.077, action: { kind: "node", node: "landing_front" } },
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

  // --- Hobbies (placeholder room — the feature itself comes later) ---------
  // A different room you walk into, linked from the motorbike drawings in the
  // cabin. Empty for now beyond the "need a minute?" fob; the hobbies feature
  // is a later build. Appears in the editor's destination picker as
  // "Hobbies · hobby_room", so a hotspot can be wired straight to it.
  hobby_room: {
    id: "hobby_room", title: "Hobbies",
    image: require("../../assets/scenes/hobby_room.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    hotspots: [
      { id: "hob_keys", caption: "Need a minute?", kind: "glow", tint: "purple", interaction: "destination", haptic: "heavy", x: 0.05, y: 0.20, w: 0.16, h: 0.16, action: { kind: "forest", mode: "jump" } },
    ],
  },

  // === OUTSIDE — the 360 walk around the cabin (first-run start) ===========
  // Pan left/right to circle the cabin; doors lead inside; the archway into the
  // forest. Door rects are rough — reposition in the editor and Export.
  exterior_front: {
    id: "exterior_front", title: "Outside",
    image: require("../../assets/scenes/exterior_front.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "exterior_left", right: "exterior_right",
    hotspots: [
      { id: "exf_door", caption: "Front door", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.380, y: 0.450, w: 0.240, h: 0.320, action: { kind: "node", node: "living_room_front" } },
    ],
  },
  exterior_right: {
    id: "exterior_right", title: "Outside",
    image: require("../../assets/scenes/exterior_right.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "exterior_front", right: "exterior_back",
    hotspots: [
      { id: "exr_kitchen", caption: "Kitchen door", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.280, y: 0.520, w: 0.220, h: 0.280, action: { kind: "node", node: "kitchen_right" } },
      { id: "exr_bedroom", caption: "Upstairs — your room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.580, y: 0.240, w: 0.185, h: 0.220, action: { kind: "node", node: "me_room_front" } },
    ],
  },
  exterior_back: {
    id: "exterior_back", title: "Outside",
    image: require("../../assets/scenes/exterior_back.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "exterior_right", right: "exterior_left",
    hotspots: [
      { id: "exb_hobby", caption: "Hobbies annex", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.360, y: 0.460, w: 0.240, h: 0.300, action: { kind: "node", node: "hobby_room" } },
      { id: "exb_archway", caption: "The archway", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.720, y: 0.400, w: 0.200, h: 0.360, action: { kind: "node", node: "exterior_forest" } },
    ],
  },
  exterior_left: {
    id: "exterior_left", title: "Outside",
    image: require("../../assets/scenes/exterior_left.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "exterior_back", right: "exterior_front",
    hotspots: [
      { id: "exl_arcade", caption: "Games room", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.340, y: 0.500, w: 0.220, h: 0.280, action: { kind: "node", node: "entertainment_left" } },
    ],
  },
  exterior_forest: {
    id: "exterior_forest", title: "The archway",
    image: require("../../assets/scenes/exterior_forest.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    back: "exterior_back",
    hotspots: [
      { id: "exf_walk", caption: "Into the woods", kind: "glow", tint: "purple", interaction: "destination", haptic: "medium", x: 0.340, y: 0.340, w: 0.320, h: 0.460, action: { kind: "node", node: "forest_canopy" } },
    ],
  },

  // === RESOURCES CLOSE-UPS (magazine ad pages) ============================
  // Resources close-up (ent) — each line links out directly. Tap
  // positions are first-pass estimates; nudge onto the lines in the editor.
  // Resources close-up (living room).
  resources_living: {
    id: "resources_living", title: "Resources",
    image: require("../../assets/scenes/resources_living.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    hotspots: [
      { id: "res_liv_999", caption: "999", kind: "plain", noRing: true, x: 0.050, y: 0.440, w: 0.420, h: 0.060, action: { kind: "link", url: "tel:999" } },
      { id: "res_liv_sam", caption: "Samaritans", kind: "plain", noRing: true, x: 0.050, y: 0.530, w: 0.420, h: 0.060, action: { kind: "link", url: "tel:116123" } },
      { id: "res_liv_111", caption: "111", kind: "plain", noRing: true, x: 0.050, y: 0.620, w: 0.420, h: 0.060, action: { kind: "link", url: "tel:111" } },
      { id: "res_liv_drink", caption: "Drinkline", kind: "plain", noRing: true, x: 0.050, y: 0.700, w: 0.420, h: 0.060, action: { kind: "link", url: "tel:03001231110" } },
      { id: "res_liv_aa", caption: "AA helpline", kind: "plain", noRing: true, x: 0.050, y: 0.770, w: 0.420, h: 0.060, action: { kind: "link", url: "tel:08009177650" } },
      { id: "res_liv_shout", caption: "Shout", kind: "plain", noRing: true, x: 0.530, y: 0.440, w: 0.420, h: 0.060, action: { kind: "link", url: "sms:85258" } },
      { id: "res_liv_nhs", caption: "NHS advice", kind: "plain", noRing: true, x: 0.530, y: 0.530, w: 0.420, h: 0.060, action: { kind: "link", url: "https://www.nhs.uk/live-well/alcohol-advice/" } },
      { id: "res_liv_7cups", caption: "7 Cups", kind: "plain", noRing: true, x: 0.530, y: 0.620, w: 0.420, h: 0.060, action: { kind: "link", url: "https://www.7cups.com" } },
      { id: "res_liv_aameet", caption: "AA meetings", kind: "plain", noRing: true, x: 0.530, y: 0.720, w: 0.420, h: 0.060, action: { kind: "link", url: "https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting" } },
      { id: "res_liv_smart", caption: "SMART Recovery", kind: "plain", noRing: true, x: 0.530, y: 0.790, w: 0.420, h: 0.060, action: { kind: "link", url: "https://smartrecovery.org.uk" } },
    ],
  },
  resources_entertainment: {
    id: "resources_entertainment", title: "Resources",
    image: require("../../assets/scenes/resources_entertainment.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    hotspots: [
      { id: "res_ent_999", caption: "999", kind: "plain", noRing: true, x: 0.077, y: 0.342, w: 0.406, h: 0.060, action: { kind: "link", url: "tel:999" } },
      { id: "res_ent_sam", caption: "Samaritans", kind: "plain", noRing: true, x: 0.083, y: 0.414, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:116123" } },
      { id: "res_ent_111", caption: "111", kind: "plain", noRing: true, x: 0.073, y: 0.499, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:111" } },
      { id: "res_ent_drink", caption: "Drinkline", kind: "plain", noRing: true, x: 0.065, y: 0.582, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:03001231110" } },
      { id: "res_ent_aa", caption: "AA helpline", kind: "plain", noRing: true, x: 0.062, y: 0.667, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:08009177650" } },
      { id: "res_ent_shout", caption: "Shout", kind: "plain", noRing: true, x: 0.552, y: 0.335, w: 0.420, h: 0.070, action: { kind: "link", url: "sms:85258" } },
      { id: "res_ent_nhs", caption: "NHS advice", kind: "plain", noRing: true, x: 0.555, y: 0.414, w: 0.420, h: 0.070, action: { kind: "link", url: "https://www.nhs.uk/live-well/alcohol-advice/" } },
      { id: "res_ent_7cups", caption: "7 Cups", kind: "plain", noRing: true, x: 0.553, y: 0.497, w: 0.420, h: 0.070, action: { kind: "link", url: "https://www.7cups.com" } },
      { id: "res_ent_aameet", caption: "AA meetings", kind: "plain", noRing: true, x: 0.564, y: 0.619, w: 0.420, h: 0.070, action: { kind: "link", url: "https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting" } },
      { id: "res_ent_smart", caption: "SMART Recovery", kind: "plain", noRing: true, x: 0.563, y: 0.696, w: 0.420, h: 0.070, action: { kind: "link", url: "https://smartrecovery.org.uk" } },
    ],
  },
  // Resources close-up (std) — each line links out directly. Tap
  // positions are first-pass estimates; nudge onto the lines in the editor.
  resources_study: {
    id: "resources_study", title: "Resources",
    image: require("../../assets/scenes/resources_study.png"),
    imgW: 934, imgH: 1684, fit: "screen",
    hotspots: [
      { id: "res_std_999", caption: "999", kind: "plain", noRing: true, x: 0.050, y: 0.425, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:999" } },
      { id: "res_std_sam", caption: "Samaritans", kind: "plain", noRing: true, x: 0.050, y: 0.515, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:116123" } },
      { id: "res_std_111", caption: "111", kind: "plain", noRing: true, x: 0.050, y: 0.595, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:111" } },
      { id: "res_std_drink", caption: "Drinkline", kind: "plain", noRing: true, x: 0.050, y: 0.665, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:03001231110" } },
      { id: "res_std_aa", caption: "AA helpline", kind: "plain", noRing: true, x: 0.050, y: 0.735, w: 0.420, h: 0.070, action: { kind: "link", url: "tel:08009177650" } },
      { id: "res_std_shout", caption: "Shout", kind: "plain", noRing: true, x: 0.530, y: 0.425, w: 0.420, h: 0.070, action: { kind: "link", url: "sms:85258" } },
      { id: "res_std_nhs", caption: "NHS advice", kind: "plain", noRing: true, x: 0.530, y: 0.515, w: 0.420, h: 0.070, action: { kind: "link", url: "https://www.nhs.uk/live-well/alcohol-advice/" } },
      { id: "res_std_7cups", caption: "7 Cups", kind: "plain", noRing: true, x: 0.530, y: 0.595, w: 0.420, h: 0.070, action: { kind: "link", url: "https://www.7cups.com" } },
      { id: "res_std_aameet", caption: "AA meetings", kind: "plain", noRing: true, x: 0.530, y: 0.685, w: 0.420, h: 0.070, action: { kind: "link", url: "https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting" } },
      { id: "res_std_smart", caption: "SMART Recovery", kind: "plain", noRing: true, x: 0.530, y: 0.765, w: 0.420, h: 0.070, action: { kind: "link", url: "https://smartrecovery.org.uk" } },
    ],
  },
  // Resources close-up (kit) — each line links out directly. Tap
  // positions are first-pass estimates; nudge onto the lines in the editor.
  resources_kitchen: {
    id: "resources_kitchen", title: "Resources",
    image: require("../../assets/scenes/resources_kitchen.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    hotspots: [
      { id: "res_kit_999", caption: "999", kind: "plain", noRing: true, x: 0.062, y: 0.327, w: 0.420, h: 0.075, action: { kind: "link", url: "tel:999" } },
      { id: "res_kit_sam", caption: "Samaritans", kind: "plain", noRing: true, x: 0.057, y: 0.424, w: 0.420, h: 0.075, action: { kind: "link", url: "tel:116123" } },
      { id: "res_kit_111", caption: "111", kind: "plain", noRing: true, x: 0.066, y: 0.524, w: 0.420, h: 0.075, action: { kind: "link", url: "tel:111" } },
      { id: "res_kit_drink", caption: "Drinkline", kind: "plain", noRing: true, x: 0.053, y: 0.621, w: 0.420, h: 0.075, action: { kind: "link", url: "tel:03001231110" } },
      { id: "res_kit_aa", caption: "AA helpline", kind: "plain", noRing: true, x: 0.053, y: 0.719, w: 0.420, h: 0.075, action: { kind: "link", url: "tel:08009177650" } },
      { id: "res_kit_shout", caption: "Shout", kind: "plain", noRing: true, x: 0.553, y: 0.324, w: 0.420, h: 0.075, action: { kind: "link", url: "sms:85258" } },
      { id: "res_kit_nhs", caption: "NHS advice", kind: "plain", noRing: true, x: 0.557, y: 0.428, w: 0.420, h: 0.075, action: { kind: "link", url: "https://www.nhs.uk/live-well/alcohol-advice/" } },
      { id: "res_kit_7cups", caption: "7 Cups", kind: "plain", noRing: true, x: 0.558, y: 0.523, w: 0.420, h: 0.075, action: { kind: "link", url: "https://www.7cups.com" } },
      { id: "res_kit_aameet", caption: "AA meetings", kind: "plain", noRing: true, x: 0.553, y: 0.658, w: 0.420, h: 0.075, action: { kind: "link", url: "https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting" } },
      { id: "res_kit_smart", caption: "SMART Recovery", kind: "plain", noRing: true, x: 0.559, y: 0.752, w: 0.420, h: 0.075, action: { kind: "link", url: "https://smartrecovery.org.uk" } },
    ],
  },
  // Resources close-up (out) — each line links out directly. Tap
  // positions are first-pass estimates; nudge onto the lines in the editor.
  resources_outdoors: {
    id: "resources_outdoors", title: "Resources",
    image: require("../../assets/scenes/resources_outdoors.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    hotspots: [
      { id: "res_out_999", caption: "999", kind: "plain", noRing: true, x: 0.069, y: 0.376, w: 0.380, h: 0.050, action: { kind: "link", url: "tel:999" } },
      { id: "res_out_sam", caption: "Samaritans", kind: "plain", noRing: true, x: 0.069, y: 0.425, w: 0.380, h: 0.050, action: { kind: "link", url: "tel:116123" } },
      { id: "res_out_111", caption: "111", kind: "plain", noRing: true, x: 0.082, y: 0.472, w: 0.380, h: 0.050, action: { kind: "link", url: "tel:111" } },
      { id: "res_out_drink", caption: "Drinkline", kind: "plain", noRing: true, x: 0.083, y: 0.525, w: 0.380, h: 0.050, action: { kind: "link", url: "tel:03001231110" } },
      { id: "res_out_aa", caption: "AA helpline", kind: "plain", noRing: true, x: 0.082, y: 0.567, w: 0.380, h: 0.050, action: { kind: "link", url: "tel:08009177650" } },
      { id: "res_out_shout", caption: "Shout", kind: "plain", noRing: true, x: 0.544, y: 0.365, w: 0.420, h: 0.050, action: { kind: "link", url: "sms:85258" } },
      { id: "res_out_nhs", caption: "NHS advice", kind: "plain", noRing: true, x: 0.535, y: 0.411, w: 0.420, h: 0.050, action: { kind: "link", url: "https://www.nhs.uk/live-well/alcohol-advice/" } },
      { id: "res_out_7cups", caption: "7 Cups", kind: "plain", noRing: true, x: 0.545, y: 0.459, w: 0.420, h: 0.050, action: { kind: "link", url: "https://www.7cups.com" } },
      { id: "res_out_aameet", caption: "AA meetings", kind: "plain", noRing: true, x: 0.553, y: 0.585, w: 0.420, h: 0.050, action: { kind: "link", url: "https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting" } },
      { id: "res_out_smart", caption: "SMART Recovery", kind: "plain", noRing: true, x: 0.566, y: 0.636, w: 0.395, h: 0.046, action: { kind: "link", url: "https://smartrecovery.org.uk" } },
    ],
  },


  // === 0.0 ALCOHOL-FREE DECK (kitchen counter close-up) ====================
  // 0.0 deck — Beer card. Flip with the arrows; each name taps to its site.
  zerozero_beer: {
    id: "zerozero_beer", title: "0.0 — Beer",
    image: require("../../assets/scenes/zerozero_beer.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    right: "zerozero_cider",
    hotspots: [
      { id: "zzb_becks", caption: "Beck's Blue", kind: "plain", noRing: true, x: 0.081, y: 0.311, w: 0.720, h: 0.110, action: { kind: "link", url: "https://www.becks.com" } },
      { id: "zzb_freedamm", caption: "Free Damm 0.0", kind: "plain", noRing: true, x: 0.081, y: 0.487, w: 0.720, h: 0.110, action: { kind: "link", url: "https://www.damm.com" } },
      { id: "zzb_doombar", caption: "Doom Bar Zero", kind: "plain", noRing: true, x: 0.090, y: 0.641, w: 0.813, h: 0.101, action: { kind: "link", url: "https://www.sharpsbrewery.co.uk" } },
      { id: "zzb_budweiser", caption: "Budweiser Zero", kind: "plain", noRing: true, x: 0.077, y: 0.795, w: 0.817, h: 0.104, action: { kind: "link", url: "https://www.budweiser.co.uk" } },
    ],
  },
  // 0.0 deck — Cider card. Flip with the arrows; each name taps to its site.
  zerozero_cider: {
    id: "zerozero_cider", title: "0.0 — Cider",
    image: require("../../assets/scenes/zerozero_cider.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "zerozero_beer", right: "zerozero_spirits",
    hotspots: [
      { id: "zzc_thatchers_zero", caption: "Thatchers Zero", kind: "plain", noRing: true, x: 0.060, y: 0.230, w: 0.820, h: 0.110, action: { kind: "link", url: "https://www.thatcherscider.co.uk" } },
      { id: "zzc_thatchers_blood", caption: "Thatchers Blood Orange 0.0", kind: "plain", noRing: true, x: 0.060, y: 0.400, w: 0.900, h: 0.110, action: { kind: "link", url: "https://www.thatcherscider.co.uk" } },
      { id: "zzc_kopp_straw", caption: "Kopparberg Strawberry & Lime", kind: "plain", noRing: true, x: 0.060, y: 0.560, w: 0.880, h: 0.150, action: { kind: "link", url: "https://www.kopparberg.co.uk" } },
      { id: "zzc_kopp_mixed", caption: "Kopparberg Mixed Fruit", kind: "plain", noRing: true, x: 0.060, y: 0.780, w: 0.880, h: 0.150, action: { kind: "link", url: "https://www.kopparberg.co.uk" } },
    ],
  },
  // 0.0 deck — Spirits card. Flip with the arrows; each name taps to its site.
  zerozero_spirits: {
    id: "zerozero_spirits", title: "0.0 — Spirits",
    image: require("../../assets/scenes/zerozero_spirits.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "zerozero_cider", right: "zerozero_wine",
    hotspots: [
      { id: "zzs_tanqueray", caption: "Tanqueray 0.0", kind: "plain", noRing: true, x: 0.060, y: 0.250, w: 0.720, h: 0.110, action: { kind: "link", url: "https://www.tanqueray.com" } },
      { id: "zzs_captain", caption: "Captain Morgan Spiced Gold 0.0", kind: "plain", noRing: true, x: 0.060, y: 0.420, w: 0.820, h: 0.160, action: { kind: "link", url: "https://www.captainmorgan.com/en-gb/our-spirits/captain-morgan-spiced-gold-0-0-alcohol-free-spirit/" } },
      { id: "zzs_cleanw", caption: "CleanCo Clean W", kind: "plain", noRing: true, x: 0.060, y: 0.660, w: 0.720, h: 0.110, action: { kind: "link", url: "https://www.clean.co" } },
      { id: "zzs_cleant", caption: "CleanCo Clean T", kind: "plain", noRing: true, x: 0.060, y: 0.830, w: 0.720, h: 0.110, action: { kind: "link", url: "https://www.clean.co" } },
    ],
  },
  // 0.0 deck — Wine card. Flip with the arrows; each name taps to its site.
  zerozero_wine: {
    id: "zerozero_wine", title: "0.0 — Wine",
    image: require("../../assets/scenes/zerozero_wine.png"),
    imgW: 851, imgH: 1847, fit: "screen",
    left: "zerozero_spirits",
    hotspots: [
      { id: "zzw_shiraz", caption: "McGuigan Zero Shiraz", kind: "plain", noRing: true, x: 0.060, y: 0.250, w: 0.860, h: 0.110, action: { kind: "link", url: "https://www.mcguiganwines.co.uk" } },
      { id: "zzw_sauv", caption: "McGuigan Zero Sauvignon Blanc", kind: "plain", noRing: true, x: 0.060, y: 0.420, w: 0.820, h: 0.160, action: { kind: "link", url: "https://www.mcguiganwines.co.uk" } },
      { id: "zzw_rose", caption: "McGuigan Zero Rose", kind: "plain", noRing: true, x: 0.060, y: 0.620, w: 0.820, h: 0.110, action: { kind: "link", url: "https://www.mcguiganwines.co.uk" } },
      { id: "zzw_freixenet", caption: "Freixenet 0.0 Sparkling White", kind: "plain", noRing: true, x: 0.060, y: 0.790, w: 0.860, h: 0.150, action: { kind: "link", url: "https://www.freixenet.com" } },
    ],
  },

};
