import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, Image, Pressable, Text, TextInput, Dimensions, Animated, PanResponder, type ImageStyle } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Defs, RadialGradient, Stop, Rect as SvgRect } from "react-native-svg";
import { HUB_NODES, HUB_START, type HubAction, type Hotspot, type GlowTint, type Haptic } from "@/data/hubScene";
import { CaptionBar } from "@/components/home/CaptionBar";
import { INLAYS } from "@/components/home/HubInlays";
import { useHubStore } from "@/store/hubStore";

// Full PHYSICAL display size — "screen", NOT "window". The window can shrink to
// exclude the Android nav bar (and when edge-to-edge gets switched on by a newer
// Android / a display setting, it does). A short window makes cover-fit draw
// every scene into a box shorter than the display and clip the top. "screen" is
// the whole display, so the art always covers it ceiling-to-floor; cover then
// shaves a sliver off the sides (invisible) instead of clipping the ceiling.
const SCREEN_W = Dimensions.get("screen").width;
const SCREEN_H = Dimensions.get("screen").height;

// The world mirrors the real time of day: night art loads from 7pm to 7am, day
// art the rest. A craving at 2am shouldn't land you on a sunlit porch — the
// scene should be the one you're actually living in.
const isNight = () => {
  const h = new Date().getHours();
  return h < 7 || h >= 19;
};

type Coords = { x: number; y: number; w: number; h: number };
// The full set of things the in-app editor can override per hotspot.
type Edits = Coords & {
  labelSize?: number;
  glowScale?: number;
  glowMax?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  opacity?: number;
  tint?: GlowTint;
  label?: string;
};

const clampI = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
const clampF = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v * 100) / 100));

const stepBtn = {
  width: 34,
  height: 34,
  borderRadius: 10,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: "rgba(255,255,255,0.08)",
  borderWidth: 1,
  borderColor: "rgba(236,233,241,0.16)",
};

// The colour each glow borrows from its object's existing light.
const GLOW_COLORS: Record<GlowTint, string> = { warm: "#F4C078", purple: "#B79CEA" };

/**
 * A soft, feathered radial light-bloom — the interaction cue for an object.
 * It fades to fully transparent well before its box edge, so nothing
 * rectangular is ever visible; it reads as ambient light, not a button. The
 * whole thing breathes via the shared `glint` value.
 */
function Bloom({
  tint,
  anchor,
  scale,
  glint,
  max = 0.5,
}: {
  tint: GlowTint;
  anchor?: { x: number; y: number };
  scale?: number;
  glint: Animated.Value;
  max?: number;
}) {
  const color = GLOW_COLORS[tint] ?? GLOW_COLORS.purple;
  const cx = `${Math.round((anchor?.x ?? 0.5) * 100)}%`;
  const cy = `${Math.round((anchor?.y ?? 0.5) * 100)}%`;
  // Cap at half the box so the bloom always reaches zero opacity BEFORE the box
  // edge — the square Rect then clips only fully-transparent pixels, so no
  // rectangle is ever visible. `scale` tightens it below that; a bigger bloom
  // means a bigger box. Reads as a soft round light, not a lit box.
  const r = `${Math.round(Math.min(scale ?? 1, 1) * 50)}%`;
  // useId can contain ":" which is invalid in an SVG id / url(#..) ref.
  const gid = "bloom" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const opacity = glint.interpolate({ inputRange: [0, 1], outputRange: [max * 0.5, max] });
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity }}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={gid} cx={cx} cy={cy} r={r} fx={cx} fy={cy} gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={color} stopOpacity="0.9" />
            <Stop offset="0.6" stopColor={color} stopOpacity="0.32" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <SvgRect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * The first-person adventure hub. You stand inside a scene and touch the real
 * things in it. The whole map lives in `src/data/hubScene.ts`, so this engine
 * is art-agnostic.
 *
 * Edit mode (toggled by the eye/grid button, top-right) turns every hotspot into
 * a draggable, resizable box so positions can be set by hand in-app; "Export"
 * prints the coordinates to paste back into hubScene.ts. Off by default now the
 * rooms are placed — the grid button switches it back on for a design pass.
 */
export function AdventureHub() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState(HUB_START);
  // Smart back: the trail of rooms you came through (via doors, not pans). Back
  // pops it, so you always return to wherever you actually came from — even for
  // a room with several doors. Falls back to the node's static `back` when the
  // trail is empty (e.g. a fresh cross-scene jump).
  const [history, setHistory] = useState<string[]>([]);
  const [caption, setCaption] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Edits>>({});
  const [showExport, setShowExport] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  // Hotspots created in-app with the editor, keyed by node id. They're exported
  // with a NEW tag so their destinations can be wired when baked into hubScene.
  const [added, setAdded] = useState<Record<string, Hotspot[]>>({});
  // Base hotspots the editor has removed from a view (ids, per node). Exported
  // as a REMOVED list so the deletions get baked back into hubScene.ts.
  const [removed, setRemoved] = useState<Record<string, string[]>>({});

  // Whether the one-time forest intro (haptic + "extra support is here" hint)
  // has been shown. Persisted so it only ever happens once, not once a launch.
  const [forestIntroSeen, setForestIntroSeen] = useState<boolean | null>(null);
  const [forestHint, setForestHint] = useState(false);

  const fade = useRef(new Animated.Value(1)).current;
  const glint = useRef(new Animated.Value(0)).current;
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The SOS "jump": we show the canopy for a beat, then this timer soft-fades
  // on to the clearing. Held in a ref so any manual navigation can cancel it.
  const forestJump = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forestHintShown = useRef(false);

  // Refs the pan responders read at gesture time so they stay current.
  const geomRef = useRef({ dispW: 1, dispH: 1, offX: 0, offY: 0 });
  const overridesRef = useRef(overrides);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; x: number; y: number; w: number; h: number } | null>(null);
  const respondersRef = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});

  const node = HUB_NODES[nodeId];
  // In the urge sanctuary (any forest/clearing view): the engine rides a
  // resources shortcut alongside, and shows a one-time "support is here" hint.
  const inForest = nodeId.startsWith("forest_") || nodeId.startsWith("clearing_");
  const removedHere = removed[nodeId] ?? [];
  // Base hotspots from the scene map (minus any removed in-app), plus any added.
  const hotspots = [...node.hotspots.filter((h) => !removedHere.includes(h.id)), ...(added[nodeId] ?? [])];
  const isAdded = (id: string) => (added[nodeId] ?? []).some((h) => h.id === id);
  const hotspotsRef = useRef(hotspots);
  hotspotsRef.current = hotspots;
  overridesRef.current = overrides;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glint, { toValue: 1, duration: 1700, useNativeDriver: true }),
        Animated.timing(glint, { toValue: 0, duration: 1700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glint]);

  useEffect(() => {
    return () => {
      if (captionTimer.current) clearTimeout(captionTimer.current);
      if (forestJump.current) clearTimeout(forestJump.current);
    };
  }, []);

  // Load the once-ever forest-intro flag.
  useEffect(() => {
    AsyncStorage.getItem("alchono.forestIntroSeen")
      .then((v) => setForestIntroSeen(v === "1"))
      .catch(() => setForestIntroSeen(true));
  }, []);

  // First time you ever reach the forest: a soft haptic + a hint that extra
  // support (a real person) is one tap away. Shown once, then persisted off.
  useEffect(() => {
    if (!inForest || forestIntroSeen !== false || forestHintShown.current) return;
    forestHintShown.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setForestHint(true);
    setForestIntroSeen(true);
    AsyncStorage.setItem("alchono.forestIntroSeen", "1").catch(() => {});
    const t = setTimeout(() => setForestHint(false), 7000);
    return () => clearTimeout(t);
  }, [inForest, forestIntroSeen]);

  const showCaption = (text: string) => {
    if (captionTimer.current) clearTimeout(captionTimer.current);
    setCaption(text);
  };
  const clearCaptionSoon = () => {
    if (captionTimer.current) clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => setCaption(null), 900);
  };

  // Returning from something a room launched (e.g. an arcade game): if the
  // launcher left a return-node, land back in that room rather than wherever
  // the hub happened to be. Stable ([]-dep) so it only fires on real focus
  // changes, never when the pending note is written mid-render.
  useFocusEffect(
    useCallback(() => {
      const pending = useHubStore.getState().pendingNode;
      if (pending && HUB_NODES[pending]) {
        setNodeId(pending);
        setCaption(null);
        // A deliberate cross-scene jump starts a fresh back-trail.
        setHistory([]);
      }
      useHubStore.getState().setPendingNode(null);
    }, []),
  );

  // `push` records the current room on the back-trail (true for doors, false for
  // pans and for Back itself, which is unwinding the trail).
  const navigateNode = (next: string, push = false) => {
    // Any deliberate move cancels a pending SOS auto-advance, so tapping around
    // the canopy during the jump never yanks you onward unexpectedly.
    if (forestJump.current) {
      clearTimeout(forestJump.current);
      forestJump.current = null;
    }
    if (push) setHistory((h) => [...h, nodeId]);
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setNodeId(next);
      setCaption(null);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  };

  // Back: unwind the trail to the room you came from; fall back to static `back`.
  const goBack = () => {
    if (history.length) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      navigateNode(prev, false);
    } else if (node.back) {
      navigateNode(node.back, false);
    }
  };

  const runAction = (action: HubAction, haptic?: Haptic) => {
    if (action.kind === "node") {
      navigateNode(action.node, true);
      return;
    }
    // The urge sanctuary. Both modes get the strong "I've got you" warning
    // haptic and push the room you came from, so Back returns you there.
    if (action.kind === "forest") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      navigateNode("forest_canopy", true);
      if (action.mode === "jump") {
        // Hold on the canopy for a beat, then soft-fade straight to the
        // clearing — no path, no walking, no decisions.
        forestJump.current = setTimeout(() => navigateNode("clearing_front", false), 1000);
      }
      return;
    }
    if (action.warn) {
      // The urge/primary action gets a deliberately different, stronger cue.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      const style =
        haptic === "heavy"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : haptic === "medium"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(style);
    }
    // Remember where to come back to (e.g. arcade games → arcade front view).
    if (action.returnNode) useHubStore.getState().setPendingNode(action.returnNode);
    router.push(action.route as any);
  };

  const isScreenFit = node.fit === "screen";
  const scale = Math.max(SCREEN_W / node.imgW, SCREEN_H / node.imgH);
  const dispW = isScreenFit ? node.imgW * scale : SCREEN_W;
  const dispH = isScreenFit ? node.imgH * scale : SCREEN_W * (node.imgH / node.imgW);
  const offX = isScreenFit ? (SCREEN_W - dispW) / 2 : 0;
  const offY = isScreenFit ? (SCREEN_H - dispH) / 2 : 0;
  geomRef.current = { dispW, dispH, offX, offY };

  const coordsOf = (h: Hotspot): Coords => overrides[h.id] ?? { x: h.x, y: h.y, w: h.w, h: h.h };
  const rectOf = (c: Coords) => ({
    position: "absolute" as const,
    left: offX + c.x * dispW,
    top: offY + c.y * dispH,
    width: c.w * dispW,
    height: c.h * dispH,
  });

  // The default text size for a kind, matching the styling below.
  const defaultSize = (h: Hotspot) =>
    h.kind === "primary" ? 22 : h.kind === "sign" ? 13 : h.prominent ? 20 : 14;

  // Merge a hotspot's base visual props with any in-app editor overrides.
  const editsOf = (h: Hotspot) => {
    const o = overrides[h.id];
    return {
      labelSize: o?.labelSize ?? h.labelSize,
      glowScale: o?.glowScale ?? h.glowScale,
      glowMax: o?.glowMax ?? h.glowMax,
      rotate: o?.rotate ?? h.rotate,
      rotateX: o?.rotateX ?? h.rotateX,
      rotateY: o?.rotateY ?? h.rotateY,
      opacity: o?.opacity ?? h.opacity,
      tint: o?.tint ?? h.tint,
      label: o?.label ?? h.label,
    };
  };

  // Write one editor property for the selected hotspot, seeding x/y/w/h so the
  // export always carries a full record.
  const setProp = (key: keyof Edits, val: number | GlowTint | string) => {
    if (!selected) return;
    const base = hotspots.find((h) => h.id === selected);
    if (!base) return;
    setOverrides((o) => {
      const cur = o[selected] ?? { x: base.x, y: base.y, w: base.w, h: base.h };
      return { ...o, [selected]: { ...cur, [key]: val } as Edits };
    });
  };

  // Create a new hotspot in the middle of the screen and select it. Its
  // destination is wired when baked (the export tags it NEW).
  const addHotspot = (kind: "label" | "glow") => {
    const id = `${kind === "label" ? "lbl" : "glow"}_new_${Date.now().toString().slice(-4)}`;
    const spot: Hotspot =
      kind === "label"
        ? { id, caption: "New label", kind: "label", label: "New label", x: 0.4, y: 0.45, w: 0.2, h: 0.08 }
        : { id, caption: "New glow", kind: "glow", tint: "purple", glowScale: 0.8, glowMax: 0.5, x: 0.42, y: 0.42, w: 0.16, h: 0.16 };
    setAdded((a) => ({ ...a, [nodeId]: [...(a[nodeId] ?? []), spot] }));
    setSelected(id);
  };

  // Delete any hotspot. Ones added in-app just vanish; base ones (baked into
  // hubScene.ts) are recorded in `removed` so the export can tell me to delete
  // them too. "Reset view" (below) brings everything back if you bin one by
  // mistake.
  const deleteSelected = () => {
    if (!selected) return;
    const id = selected;
    if (isAdded(id)) {
      setAdded((a) => ({ ...a, [nodeId]: (a[nodeId] ?? []).filter((h) => h.id !== id) }));
    } else {
      setRemoved((r) => ({ ...r, [nodeId]: [...(r[nodeId] ?? []), id] }));
    }
    setOverrides((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });
    setSelected(null);
  };

  // Undo all edits for the current view — restores deleted base hotspots, drops
  // added ones, clears position/style overrides. A safety net, not a save.
  const resetView = () => {
    setRemoved((r) => ({ ...r, [nodeId]: [] }));
    setAdded((a) => ({ ...a, [nodeId]: [] }));
    setOverrides((o) => {
      const next = { ...o };
      for (const h of node.hotspots) delete next[h.id];
      return next;
    });
    setSelected(null);
  };

  const affordance = (h: Hotspot) => {
    const kind = h.kind ?? "plain";
    const e = editsOf(h);

    // Live inlay: real content painted onto the object (arcade screen, community
    // board, papers on the rack), always on and clipped to the object's box. It's
    // pointer-transparent so the tap still routes via the hotspot's action.
    if (h.inlay && INLAYS[h.inlay]) {
      const Inlay = INLAYS[h.inlay];
      return (
        <View
          pointerEvents="none"
          style={{
            flex: 1,
            overflow: "hidden",
            borderRadius: 3,
            opacity: e.opacity ?? 1,
            // perspective first so the tilts foreshorten (depth); then spin.
            transform: [
              { perspective: 600 },
              { rotateX: `${e.rotateX ?? 0}deg` },
              { rotateY: `${e.rotateY ?? 0}deg` },
              { rotate: `${e.rotate ?? 0}deg` },
            ],
          }}
        >
          <Inlay />
        </View>
      );
    }

    // Interactive objects: when the node has a painted glow layer, the art
    // carries the affordance and the hotspot is just an invisible tap target.
    // Otherwise fall back to a soft engine-drawn light bloom.
    if (kind === "glow") {
      if (node.glowImage) return null;
      return <Bloom tint={e.tint ?? "purple"} anchor={h.anchor} scale={e.glowScale} glint={glint} max={e.glowMax ?? 0.5} />;
    }

    // Text: environmental signage (label) and the dominant urge action (primary),
    // plus the legacy interactive board/sign labels the left/right views use.
    if (kind === "label" || kind === "primary" || kind === "board" || kind === "sign") {
      const primary = kind === "primary";
      // PatrickHand is a light chalk-hand; per-label size, rotation and (for
      // glows) colour/strength are all tunable live in the in-app editor.
      const size = e.labelSize ?? defaultSize(h);
      const labelText = e.label ?? h.label ?? h.caption;
      // Allow as many lines as the text needs (min 2), so a vertical sign like
      // "2\n4\n/\n7" isn't clipped at two lines.
      const labelLines = Math.max(2, String(labelText ?? "").split("\n").length);
      // Labels always shrink to fit their box and stay centered (labelSize is the
      // max/starting size). Rotation and depth tilt apply through a perspective,
      // just like inlays, so a sign can sit into an angled surface.
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 2,
            overflow: "visible",
            opacity: e.opacity ?? 1,
            transform: [
              { perspective: 600 },
              { rotateX: `${e.rotateX ?? 0}deg` },
              { rotateY: `${e.rotateY ?? 0}deg` },
              { rotate: `${e.rotate ?? 0}deg` },
            ],
          }}
        >
          {/* The urge sign carries a restrained idle glow so it's the easiest
              thing to find, without becoming neon signage. */}
          {primary ? <Bloom tint="purple" glint={glint} scale={1} max={0.32} /> : null}
          <Text
            numberOfLines={labelLines}
            adjustsFontSizeToFit
            style={{
              fontFamily: "PatrickHand",
              color: primary ? "#FFFFFF" : "#F4EFFA",
              fontSize: size,
              lineHeight: Math.round(size * 1.2),
              letterSpacing: 0,
              textAlign: "center",
              textTransform: primary || h.prominent ? "uppercase" : "none",
              textShadowColor: "rgba(0,0,0,0.95)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: primary ? 10 : 6,
            }}
          >
            {labelText}
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderHotspots = () =>
    hotspots.map((h) => {
      // Pure signage (no action) isn't tappable — taps fall through so it never
      // behaves like a button. A label WITH an action IS tappable, so a text
      // label (e.g. "My Sky" over the window) can be the tap target on its own,
      // with no glow blob needed to catch the press.
      if (!h.action) {
        return (
          <View key={h.id} pointerEvents="none" style={rectOf(coordsOf(h))}>
            {affordance(h)}
          </View>
        );
      }
      const action = h.action;
      return (
        <Pressable
          key={h.id}
          accessibilityRole="button"
          accessibilityLabel={h.caption}
          onPressIn={() => showCaption(h.caption)}
          onPressOut={clearCaptionSoon}
          onPress={() => {
            showCaption(h.caption);
            runAction(action, h.haptic);
          }}
          hitSlop={12}
          style={rectOf(coordsOf(h))}
        >
          {affordance(h)}
        </Pressable>
      );
    });

  // Stable per-hotspot pan responders (created once, read live values via refs).
  const getResponder = (id: string, mode: "move" | "resize") => {
    const key = id + ":" + mode;
    if (!respondersRef.current[key]) {
      respondersRef.current[key] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          const base = hotspotsRef.current.find((x) => x.id === id);
          if (!base) return;
          setSelected(id);
          const c = overridesRef.current[id] ?? { x: base.x, y: base.y, w: base.w, h: base.h };
          dragRef.current = { id, mode, x: c.x, y: c.y, w: c.w, h: c.h };
        },
        onPanResponderMove: (_e, g) => {
          const d = dragRef.current;
          if (!d || d.id !== id || d.mode !== mode) return;
          const { dispW: dw, dispH: dh } = geomRef.current;
          if (mode === "move") {
            // Allow dragging partly off-screen (a paper tucked into the rack, an
            // object running off the edge), keeping a small sliver on-screen so
            // the box can still be grabbed back.
            const x = Math.max(-d.w + 0.06, Math.min(0.94, d.x + g.dx / dw));
            const y = Math.max(-d.h + 0.06, Math.min(0.94, d.y + g.dy / dh));
            setOverrides((o) => ({ ...o, [id]: { ...(o[id] ?? {}), x, y, w: d.w, h: d.h } }));
          } else {
            // Allow oversized boxes — a paper big enough to read whose edge runs
            // off the screen.
            const w = Math.max(0.03, Math.min(2, d.w + g.dx / dw));
            const h2 = Math.max(0.02, Math.min(2, d.h + g.dy / dh));
            setOverrides((o) => ({ ...o, [id]: { ...(o[id] ?? {}), x: d.x, y: d.y, w, h: h2 } }));
          }
        },
        onPanResponderRelease: () => {
          dragRef.current = null;
        },
        onPanResponderTerminate: () => {
          dragRef.current = null;
        },
      });
    }
    return respondersRef.current[key];
  };

  const renderEditBoxes = () => {
    // Each box shows the REAL affordance (WYSIWYG) so edits preview live, with a
    // thin outline marking the tap zone — bright for the selected hotspot, faint
    // otherwise. Tapping (or dragging) a box selects it.
    const boxes = hotspots.map((h) => {
      const c = coordsOf(h);
      const isSel = selected === h.id;
      return (
        <View key={h.id + "-box"} style={rectOf(c)} {...getResponder(h.id, "move").panHandlers}>
          {affordance(h)}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              borderWidth: isSel ? 2 : 1,
              borderStyle: isSel ? "solid" : "dashed",
              borderColor: isSel ? "#E9DEFF" : "rgba(201,184,240,0.4)",
              borderRadius: 4,
              backgroundColor: isSel ? "rgba(164,137,222,0.12)" : "transparent",
            }}
          />
          <View pointerEvents="none" style={{ position: "absolute", top: -12, left: 0 }}>
            <Text numberOfLines={1} style={{ color: isSel ? "#FFFFFF" : "rgba(233,222,255,0.7)", fontSize: 9, fontWeight: "700" }}>
              {h.id}
            </Text>
          </View>
        </View>
      );
    });
    // Resize handle for the SELECTED hotspot only, as a top-layer sibling. A
    // child positioned outside its parent's bounds is NOT touchable on iOS, so
    // the handle lives in the scene container rather than hanging off the box.
    const handles = hotspots
      .filter((h) => h.id === selected)
      .map((h) => {
        const c = coordsOf(h);
        const left = offX + (c.x + c.w) * dispW - 16;
        const top = offY + (c.y + c.h) * dispH - 16;
        return (
          <View
            key={h.id + "-handle"}
            {...getResponder(h.id, "resize").panHandlers}
            style={{
              position: "absolute",
              left,
              top,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "rgba(164,137,222,0.98)",
              borderWidth: 2,
              borderColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="maximize-2" size={14} color="#1a1622" />
          </View>
        );
      });
    return [...boxes, ...handles];
  };

  // The little control panel for the currently-selected hotspot.
  const renderInspector = () => {
    const sel = selected ? hotspots.find((h) => h.id === selected) : null;
    if (!sel) return null;
    const kind = sel.kind ?? "plain";
    const hasInlay = !!sel.inlay;
    const isText = kind === "label" || kind === "primary" || kind === "board" || kind === "sign";
    // A glow's colour/size controls are meaningless once an inlay replaces the
    // bloom; inlays get the rotate control instead so they sit on the object.
    const isGlow = kind === "glow" && !hasInlay;
    const canRotate = isText || hasInlay;
    const e = editsOf(sel);
    const size = e.labelSize ?? defaultSize(sel);
    const rot = e.rotate ?? 0;
    const rotY = e.rotateY ?? 0;
    const rotX = e.rotateX ?? 0;
    const op = e.opacity ?? 1;
    const gscale = e.glowScale ?? 1;
    const gmax = e.glowMax ?? 0.5;
    const tint = e.tint ?? "purple";

    const row = (label: string, value: string, onDec: () => void, onInc: () => void) => (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <Text style={{ color: "#CFC8DE", fontSize: 13 }}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={onDec} hitSlop={8} style={stepBtn}>
            <Feather name="minus" size={16} color="#EFEAF5" />
          </Pressable>
          <Text style={{ color: "#ECE9F1", fontSize: 13, fontWeight: "700", width: 54, textAlign: "center" }}>{value}</Text>
          <Pressable onPress={onInc} hitSlop={8} style={stepBtn}>
            <Feather name="plus" size={16} color="#EFEAF5" />
          </Pressable>
        </View>
      </View>
    );

    return (
      <View
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 158,
          backgroundColor: "rgba(20,17,28,0.97)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(190,160,210,0.45)",
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#ECE9F1", fontSize: 13, fontWeight: "700" }}>Editing: {sel.id}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={deleteSelected} hitSlop={8} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "rgba(200,80,90,0.22)", borderWidth: 1, borderColor: "rgba(220,120,130,0.5)" }}>
              <Text style={{ color: "#F0C4C8", fontSize: 12, fontWeight: "600" }}>Delete</Text>
            </Pressable>
            <Pressable onPress={() => setSelected(null)} hitSlop={8} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)" }}>
              <Text style={{ color: "#CFC8DE", fontSize: 12, fontWeight: "600" }}>Done</Text>
            </Pressable>
          </View>
        </View>

        {isText ? (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: "#8b849b", fontSize: 11, marginBottom: 4 }}>Label text</Text>
            <TextInput
              value={e.label ?? sel.label ?? ""}
              onChangeText={(t) => setProp("label", t)}
              placeholder="Type the label…"
              placeholderTextColor="#6f6880"
              style={{
                color: "#ECE9F1",
                fontSize: 14,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(236,233,241,0.16)",
              }}
            />
          </View>
        ) : null}

        {isText ? row("Text size", `${size}`, () => setProp("labelSize", clampI(size - 1, 6, 64)), () => setProp("labelSize", clampI(size + 1, 6, 64))) : null}
        {canRotate ? row("Rotate", `${rot}°`, () => setProp("rotate", clampI(rot - 1, -180, 180)), () => setProp("rotate", clampI(rot + 1, -180, 180))) : null}
        {canRotate ? row("Tilt ↔ (depth)", `${rotY}°`, () => setProp("rotateY", clampI(rotY - 2, -85, 85)), () => setProp("rotateY", clampI(rotY + 2, -85, 85))) : null}
        {canRotate ? row("Tilt ↕ (depth)", `${rotX}°`, () => setProp("rotateX", clampI(rotX - 2, -85, 85)), () => setProp("rotateX", clampI(rotX + 2, -85, 85))) : null}
        {isText || hasInlay ? row(hasInlay ? "Brightness" : "Opacity", op.toFixed(2), () => setProp("opacity", clampF(op - 0.05, 0.1, 1)), () => setProp("opacity", clampF(op + 0.05, 0.1, 1))) : null}
        {isGlow ? row("Glow size", gscale.toFixed(2), () => setProp("glowScale", clampF(gscale - 0.05, 0.2, 1.6)), () => setProp("glowScale", clampF(gscale + 0.05, 0.2, 1.6))) : null}
        {isGlow ? row("Glow strength", gmax.toFixed(2), () => setProp("glowMax", clampF(gmax - 0.05, 0.1, 0.95)), () => setProp("glowMax", clampF(gmax + 0.05, 0.1, 0.95))) : null}
        {isGlow ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ color: "#CFC8DE", fontSize: 13 }}>Colour</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["warm", "purple"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setProp("tint", t)}
                  hitSlop={6}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: tint === t ? GLOW_COLORS[t] : "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: tint === t ? "#FFFFFF" : "rgba(236,233,241,0.14)",
                  }}
                >
                  <Text style={{ color: tint === t ? "#1a1622" : "#CFC8DE", fontSize: 12, fontWeight: "700" }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <Text style={{ color: "#6f6880", fontSize: 10.5, marginTop: 10 }}>drag to move · corner handle to resize</Text>
      </View>
    );
  };

  const turnArrow = (dir: "left" | "right" | "back", target: string) => {
    const cap = dir === "back" ? "Back" : dir === "left" ? "Turn left" : "Turn right";
    const icon = dir === "back" ? "corner-up-left" : dir === "left" ? "chevron-left" : "chevron-right";
    const pos =
      dir === "back"
        ? { top: 52, left: 16 }
        : dir === "left"
        ? { top: SCREEN_H / 2 - 26, left: 8 }
        : { top: SCREEN_H / 2 - 26, right: 8 };
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cap}
        onPressIn={() => showCaption(cap)}
        onPressOut={clearCaptionSoon}
        onPress={() => {
          showCaption(cap);
          if (dir === "back") goBack();
          else navigateNode(target);
        }}
        hitSlop={12}
        style={{
          position: "absolute",
          ...pos,
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(13,11,18,0.5)",
          borderWidth: 1,
          borderColor: "rgba(190,160,210,0.4)",
        }}
        className="active:opacity-70"
      >
        <Feather name={icon as any} size={24} color="#EFEAF5" />
      </Pressable>
    );
  };

  const exportText = hotspots
    .map((h) => {
      const c = coordsOf(h);
      const e = editsOf(h);
      const extra: string[] = [];
      if (e.labelSize != null) extra.push(`labelSize ${Math.round(e.labelSize)}`);
      if (e.rotate) extra.push(`rotate ${Math.round(e.rotate)}`);
      if (e.rotateY) extra.push(`rotateY ${Math.round(e.rotateY)}`);
      if (e.rotateX) extra.push(`rotateX ${Math.round(e.rotateX)}`);
      if (e.opacity != null && e.opacity !== 1) extra.push(`opacity ${e.opacity.toFixed(2)}`);
      if (e.glowScale != null) extra.push(`glowScale ${e.glowScale.toFixed(2)}`);
      if (e.glowMax != null) extra.push(`glowMax ${e.glowMax.toFixed(2)}`);
      if (e.tint) extra.push(`tint ${e.tint}`);
      const newItem = isAdded(h.id);
      // New items carry their kind + text so they can be baked from scratch (and
      // their destination wired), not just matched to an existing hotspot.
      if (newItem) {
        extra.unshift(`kind ${h.kind ?? "label"}`);
        const text = e.label ?? h.label;
        if (text) extra.push(`text "${text}"`);
      } else if (e.label != null && e.label !== h.label) {
        extra.push(`text "${e.label}"`);
      }
      const prefix = newItem ? "NEW " : "";
      const base = `${prefix}${h.id}: x ${c.x.toFixed(3)}, y ${c.y.toFixed(3)}, w ${c.w.toFixed(3)}, h ${c.h.toFixed(3)}`;
      return extra.length ? `${base}, ${extra.join(", ")}` : base;
    })
    .join("\n") +
    (removedHere.length ? `\n\nREMOVED (delete these from ${node.id} when baking):\n${removedHere.join(", ")}` : "");

  // Screen-fit: the image fills the full screen (captured SCREEN_W × SCREEN_H)
  // and cover-fit crops the overflow. This is the sizing that rendered the old
  // café art correctly — full height, no clip.
  const imgStyle: ImageStyle = isScreenFit
    ? { position: "absolute", left: 0, top: 0, width: SCREEN_W, height: SCREEN_H }
    : { width: SCREEN_W, height: dispH };

  const sceneInner = (
    <>
      <Image source={isNight() && node.nightImage ? node.nightImage : node.image} style={imgStyle} resizeMode="cover" />
      {/* The painted glow layer, breathing 0→1→0 over the base so every object's
          glow pulses together. When present, glow hotspots draw no engine bloom.
          It sits below the hotspots (rendered next), so taps still reach them. */}
      {node.glowImage ? (
        <Animated.Image source={node.glowImage} style={[imgStyle, { opacity: glint }]} resizeMode="cover" />
      ) : null}
      {editMode ? renderEditBoxes() : renderHotspots()}
      {!editMode && node.left ? turnArrow("left", node.left) : null}
      {!editMode && node.right ? turnArrow("right", node.right) : null}
      {!editMode && (history.length > 0 || node.back) ? turnArrow("back", node.back ?? "") : null}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <Animated.View style={{ flex: 1, opacity: fade }}>
        {isScreenFit ? (
          <View style={{ flex: 1 }}>{sceneInner}</View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={{ width: SCREEN_W, height: dispH, position: "relative" }}>{sceneInner}</View>
          </ScrollView>
        )}
      </Animated.View>

      <CaptionBar caption={caption} />

      {/* Design-pass: toggle the drag-to-place boxes on/off. */}
      <Pressable
        onPress={() => setEditMode((v) => !v)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={editMode ? "Hide touch zones" : "Edit touch zones"}
        style={{
          position: "absolute",
          top: 52,
          right: 14,
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(13,11,18,0.6)",
          borderWidth: 1,
          borderColor: "rgba(190,160,210,0.4)",
        }}
        className="active:opacity-70"
      >
        <Feather name={editMode ? "eye-off" : "grid"} size={18} color="#EFEAF5" />
      </Pressable>

      {/* One shortcut, always a tap away from any view: your Personal File —
          profile + settings folded into the drawn folder. Hidden during a
          design pass so it doesn't clutter the editor. */}
      {!editMode ? (
        <Pressable
          onPress={() => router.push("/profile/file" as any)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Personal file"
          className="active:opacity-70"
          style={{ position: "absolute", top: 100, right: 14, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(13,11,18,0.6)", borderWidth: 1, borderColor: "rgba(190,160,210,0.4)" }}
        >
          <Feather name="folder" size={18} color="#EFEAF5" />
        </Pressable>
      ) : null}

      {/* The urge sanctuary carries a quiet shortcut to real human support —
          the crisis-lines book — always a tap away while you ride it out. */}
      {inForest && !editMode ? (
        <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 40, alignItems: "center" }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/resources/home" as any);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Extra support — help and crisis lines"
            className="active:opacity-80"
            style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, backgroundColor: "rgba(13,11,18,0.72)", borderWidth: 1, borderColor: "rgba(240,201,135,0.5)" }}
          >
            <Feather name="life-buoy" size={16} color="#F0C987" />
            <Text style={{ color: "#F3EEDB", fontSize: 13.5, fontWeight: "600" }}>Extra support</Text>
          </Pressable>
        </View>
      ) : null}

      {/* First-ever visit: point out that a real person is one tap away, so the
          escape hatch is learned here in the calm, before it's ever needed. */}
      {forestHint && !editMode ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 24, right: 24, bottom: 96, alignItems: "center" }}>
          <View style={{ backgroundColor: "rgba(13,11,18,0.88)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(240,201,135,0.45)" }}>
            <Text style={{ color: "#F3EEDB", fontSize: 13.5, textAlign: "center", lineHeight: 19 }}>
              If the urge gets too big, extra support is right here ↓{"\n"}You can always reach a real person.
            </Text>
          </View>
        </View>
      ) : null}

      {editMode ? (
        <Pressable
          onPress={() => setShowExport(true)}
          style={{
            position: "absolute",
            bottom: 104,
            alignSelf: "center",
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: "rgba(59,51,82,0.95)",
            borderWidth: 1,
            borderColor: "rgba(190,160,210,0.6)",
          }}
          className="active:opacity-80"
        >
          <Text style={{ color: "#F0EBF5", fontSize: 13, fontWeight: "600" }}>Export coordinates</Text>
        </Pressable>
      ) : null}

      {/* Undo everything on this view — restores deleted spots, drops added ones,
          clears position/style tweaks. Safety net if you bin one by mistake. */}
      {editMode ? (
        <Pressable
          onPress={resetView}
          hitSlop={8}
          style={{
            position: "absolute",
            bottom: 104,
            left: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: "rgba(20,17,28,0.92)",
            borderWidth: 1,
            borderColor: "rgba(190,160,210,0.4)",
          }}
          className="active:opacity-80"
        >
          <Text style={{ color: "#CFC8DE", fontSize: 12.5, fontWeight: "600" }}>Reset view</Text>
        </Pressable>
      ) : null}

      {editMode && !selected ? (
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 158, flexDirection: "row", gap: 10, justifyContent: "center" }}>
          {(["label", "glow"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => addHotspot(k)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: "rgba(20,17,28,0.95)",
                borderWidth: 1,
                borderColor: "rgba(190,160,210,0.45)",
              }}
              className="active:opacity-80"
            >
              <Feather name={k === "label" ? "type" : "sun"} size={15} color="#EFEAF5" />
              <Text style={{ color: "#F0EBF5", fontSize: 13, fontWeight: "600" }}>{k === "label" ? "Add label" : "Add glow"}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {editMode ? renderInspector() : null}

      {showExport ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(6,5,10,0.96)", paddingTop: 90, paddingHorizontal: 20 }}>
          <Text style={{ color: "#ECE9F1", fontSize: 15, fontWeight: "700", marginBottom: 4 }}>
            {node.id} — hotspot coordinates
          </Text>
          <Text style={{ color: "#817B91", fontSize: 12, marginBottom: 14 }}>
            Screenshot this (or copy) and send it over — I&apos;ll bake it into the scene.
          </Text>
          <ScrollView style={{ flex: 1 }}>
            <Text selectable style={{ color: "#CFC8DE", fontSize: 13, lineHeight: 22 }}>
              {exportText}
            </Text>
          </ScrollView>
          <Pressable
            onPress={() => setShowExport(false)}
            style={{ alignSelf: "center", marginVertical: 24, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 8, backgroundColor: "#A489DE" }}
            className="active:opacity-80"
          >
            <Text style={{ color: "#1a1622", fontSize: 14, fontWeight: "700" }}>Close</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
