import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView, Image, Pressable, Text, TextInput, Dimensions, Animated, PanResponder, type ImageStyle } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, { Defs, RadialGradient, Stop, Rect as SvgRect } from "react-native-svg";
import { HUB_NODES, HUB_START, type HubAction, type Hotspot, type GlowTint, type Haptic } from "@/data/hubScene";
import { CaptionBar } from "@/components/home/CaptionBar";
import { HubLoadingScreen } from "@/components/home/HubLoadingScreen";
import { CommunityPreview } from "@/components/home/CommunityPreview";

// Hotspots whose `preview` interaction opens an in-place zoom with real content
// instead of routing to a room. Add an entry as each preview's content is built.
const PREVIEW_CONTENT: Record<string, (props: { onClose: () => void }) => React.ReactElement> = {
  community: CommunityPreview,
};

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

// Boot the CD-ROM once per app launch, not on every return to the hub.
let hubBooted = false;

type Coords = { x: number; y: number; w: number; h: number };
// The full set of things the in-app editor can override per hotspot.
type Edits = Coords & {
  labelSize?: number;
  glowScale?: number;
  glowMax?: number;
  rotate?: number;
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
  const r = `${Math.round((scale ?? 1) * 62)}%`;
  // useId can contain ":" which is invalid in an SVG id / url(#..) ref.
  const gid = "bloom" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const opacity = glint.interpolate({ inputRange: [0, 1], outputRange: [max * 0.5, max] });
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity }}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={gid} cx={cx} cy={cy} r={r} fx={cx} fy={cy} gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={color} stopOpacity="0.95" />
            <Stop offset="0.55" stopColor={color} stopOpacity="0.35" />
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
 * Edit mode (toggled by the eye/grid button) turns every hotspot into a
 * draggable, resizable box so positions can be set by hand in-app; "Export"
 * prints the coordinates to paste back into hubScene.ts. On during a design
 * pass (relocating hotspots after new art); flip to false for a release build.
 */
export function AdventureHub() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState(HUB_START);
  const [caption, setCaption] = useState<string | null>(null);
  const [booted, setBooted] = useState(hubBooted);
  const [editMode, setEditMode] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, Edits>>({});
  const [showExport, setShowExport] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Hotspots created in-app with the editor, keyed by node id. They're exported
  // with a NEW tag so their destinations can be wired when baked into hubScene.
  const [added, setAdded] = useState<Record<string, Hotspot[]>>({});

  const fade = useRef(new Animated.Value(1)).current;
  const glint = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(0)).current;
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs the pan responders read at gesture time so they stay current.
  const geomRef = useRef({ dispW: 1, dispH: 1, offX: 0, offY: 0 });
  const overridesRef = useRef(overrides);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; x: number; y: number; w: number; h: number } | null>(null);
  const respondersRef = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});

  const node = HUB_NODES[nodeId];
  // Base hotspots from the scene map, plus any added in-app for this node.
  const hotspots = [...node.hotspots, ...(added[nodeId] ?? [])];
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
    };
  }, []);

  const showCaption = (text: string) => {
    if (captionTimer.current) clearTimeout(captionTimer.current);
    setCaption(text);
  };
  const clearCaptionSoon = () => {
    if (captionTimer.current) clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => setCaption(null), 900);
  };

  const navigateNode = (next: string) => {
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setNodeId(next);
      setCaption(null);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  };

  const runAction = (action: HubAction, haptic?: Haptic) => {
    if (action.kind === "node") {
      navigateNode(action.node);
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
    router.push(action.route as any);
  };

  const openPreview = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreview(id);
    zoom.setValue(0);
    Animated.timing(zoom, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  };
  const closePreview = () => {
    Animated.timing(zoom, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => setPreview(null));
  };

  if (!booted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
        <HubLoadingScreen
          onDone={() => {
            hubBooted = true;
            setBooted(true);
          }}
        />
      </View>
    );
  }

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

  const deleteSelected = () => {
    if (!selected) return;
    const id = selected;
    setAdded((a) => ({ ...a, [nodeId]: (a[nodeId] ?? []).filter((h) => h.id !== id) }));
    setOverrides((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });
    setSelected(null);
  };

  const affordance = (h: Hotspot) => {
    const kind = h.kind ?? "plain";
    const e = editsOf(h);

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
      // With an explicit labelSize we hold that size and let the text spill
      // outside its box (e.g. the tiny far-away "Me" door — small tap target,
      // still-readable whisper). Otherwise the label shrinks to fit its box.
      const fitToBox = e.labelSize == null;
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 2,
            overflow: "visible",
            transform: [{ rotate: `${e.rotate ?? 0}deg` }],
          }}
        >
          {/* The urge sign carries a restrained idle glow so it's the easiest
              thing to find, without becoming neon signage. */}
          {primary ? <Bloom tint="purple" glint={glint} scale={1} max={0.32} /> : null}
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit={fitToBox}
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
            {e.label ?? h.label ?? h.caption}
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderHotspots = () =>
    hotspots.map((h) => {
      // Pure signage (label kind, or anything with no action) isn't tappable —
      // taps fall through so it never behaves like a button.
      if (h.kind === "label" || !h.action) {
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
            // Previews with built content zoom in place; everything else routes.
            if (h.interaction === "preview" && PREVIEW_CONTENT[h.id]) {
              openPreview(h.id);
              return;
            }
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
            const x = Math.max(0, Math.min(1 - d.w, d.x + g.dx / dw));
            const y = Math.max(0, Math.min(1 - d.h, d.y + g.dy / dh));
            setOverrides((o) => ({ ...o, [id]: { ...(o[id] ?? {}), x, y, w: d.w, h: d.h } }));
          } else {
            const w = Math.max(0.03, Math.min(1 - d.x, d.w + g.dx / dw));
            const h2 = Math.max(0.02, Math.min(1 - d.y, d.h + g.dy / dh));
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
    const isText = kind === "label" || kind === "primary" || kind === "board" || kind === "sign";
    const isGlow = kind === "glow";
    const e = editsOf(sel);
    const size = e.labelSize ?? defaultSize(sel);
    const rot = e.rotate ?? 0;
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
            {isAdded(sel.id) ? (
              <Pressable onPress={deleteSelected} hitSlop={8} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "rgba(200,80,90,0.22)", borderWidth: 1, borderColor: "rgba(220,120,130,0.5)" }}>
                <Text style={{ color: "#F0C4C8", fontSize: 12, fontWeight: "600" }}>Delete</Text>
              </Pressable>
            ) : null}
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
        {isText ? row("Rotate", `${rot}°`, () => setProp("rotate", clampI(rot - 2, -90, 90)), () => setProp("rotate", clampI(rot + 2, -90, 90))) : null}
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
    const cap = dir === "back" ? "Back to the café" : dir === "left" ? "Turn left" : "Turn right";
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
          navigateNode(target);
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
    .join("\n");

  const imgStyle: ImageStyle = isScreenFit
    ? { position: "absolute", left: 0, top: 0, width: SCREEN_W, height: SCREEN_H }
    : { width: SCREEN_W, height: dispH };

  const sceneInner = (
    <>
      <Image source={node.image} style={imgStyle} resizeMode="cover" />
      {/* The painted glow layer, breathing 0→1→0 over the base so every object's
          glow pulses together. When present, glow hotspots draw no engine bloom.
          It sits below the hotspots (rendered next), so taps still reach them. */}
      {node.glowImage ? (
        <Animated.Image source={node.glowImage} style={[imgStyle, { opacity: glint }]} resizeMode="cover" />
      ) : null}
      {editMode ? renderEditBoxes() : renderHotspots()}
      {!editMode && node.left ? turnArrow("left", node.left) : null}
      {!editMode && node.right ? turnArrow("right", node.right) : null}
      {!editMode && node.back ? turnArrow("back", node.back) : null}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <Animated.View
        style={{ flex: 1, opacity: fade, transform: [{ scale: zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }}
      >
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

      {/* Preview zoom — a hotspot's content peeked in place, over the room. */}
      {preview ? (
        <Animated.View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: zoom }}>
          <Pressable
            style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,6,12,0.8)" }}
            onPress={closePreview}
          />
          <Animated.View style={{ flex: 1, transform: [{ scale: zoom.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }}>
            {(() => {
              const Content = PREVIEW_CONTENT[preview];
              return Content ? <Content onClose={closePreview} /> : null;
            })()}
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}
