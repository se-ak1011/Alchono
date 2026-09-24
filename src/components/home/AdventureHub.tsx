import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView, Image, Pressable, Text, Dimensions, Animated, PanResponder } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { HUB_NODES, HUB_START, type HubAction, type Hotspot } from "@/data/hubScene";
import { CaptionBar } from "@/components/home/CaptionBar";
import { HubLoadingScreen } from "@/components/home/HubLoadingScreen";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

// Boot the CD-ROM once per app launch, not on every return to the hub.
let hubBooted = false;

type Coords = { x: number; y: number; w: number; h: number };

/**
 * The first-person adventure hub. You stand inside a scene and touch the real
 * things in it. The whole map lives in `src/data/hubScene.ts`, so this engine
 * is art-agnostic.
 *
 * Edit mode (toggled by the eye/grid button) turns every hotspot into a
 * draggable, resizable box so positions can be set by hand in-app; "Export"
 * prints the coordinates to paste back into hubScene.ts. It's off by default
 * now that all three rooms are placed — tap the grid button to nudge things.
 */
export function AdventureHub() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState(HUB_START);
  const [caption, setCaption] = useState<string | null>(null);
  const [booted, setBooted] = useState(hubBooted);
  const [editMode, setEditMode] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Coords>>({});
  const [showExport, setShowExport] = useState(false);

  const fade = useRef(new Animated.Value(1)).current;
  const glint = useRef(new Animated.Value(0)).current;
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs the pan responders read at gesture time so they stay current.
  const geomRef = useRef({ dispW: 1, dispH: 1, offX: 0, offY: 0 });
  const overridesRef = useRef(overrides);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; x: number; y: number; w: number; h: number } | null>(null);
  const respondersRef = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});

  const node = HUB_NODES[nodeId];
  const hotspotsRef = useRef(node.hotspots);
  hotspotsRef.current = node.hotspots;
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

  const runAction = (action: HubAction) => {
    if (action.kind === "node") {
      navigateNode(action.node);
      return;
    }
    if (action.warn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(action.route as any);
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

  const glowOpacity = glint.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.34] });

  const affordance = (h: Hotspot) => {
    const kind = h.kind ?? "plain";
    if (kind === "board" || kind === "sign") {
      // Text only — no box — so it blends into the scene. SkinnyCustard has no
      // bold, so it "pops" via size + a strong shadow rather than weight.
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 }}>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            style={{
              fontFamily: "SkinnyCustard",
              color: "#F4EFFA",
              fontSize: h.prominent ? 26 : kind === "sign" ? 16 : 17,
              lineHeight: h.prominent ? 32 : 20,
              letterSpacing: h.prominent ? 0.5 : 0,
              textAlign: "center",
              textTransform: h.prominent ? "uppercase" : "none",
              textShadowColor: "rgba(0,0,0,0.95)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 6,
            }}
          >
            {h.label ?? h.caption}
          </Text>
        </View>
      );
    }
    if (kind === "glow") {
      return <Animated.View style={{ flex: 1, borderRadius: 10, backgroundColor: "#A489DE", opacity: glowOpacity }} />;
    }
    return null;
  };

  const renderHotspots = () =>
    node.hotspots.map((h) => (
      <Pressable
        key={h.id}
        accessibilityRole="button"
        accessibilityLabel={h.caption}
        onPressIn={() => showCaption(h.caption)}
        onPressOut={clearCaptionSoon}
        onPress={() => {
          showCaption(h.caption);
          runAction(h.action);
        }}
        hitSlop={8}
        style={rectOf(coordsOf(h))}
      >
        {affordance(h)}
      </Pressable>
    ));

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
            setOverrides((o) => ({ ...o, [id]: { x, y, w: d.w, h: d.h } }));
          } else {
            const w = Math.max(0.03, Math.min(1 - d.x, d.w + g.dx / dw));
            const h2 = Math.max(0.02, Math.min(1 - d.y, d.h + g.dy / dh));
            setOverrides((o) => ({ ...o, [id]: { x: d.x, y: d.y, w, h: h2 } }));
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
    const boxes = node.hotspots.map((h) => {
      const c = coordsOf(h);
      return (
        <View key={h.id + "-box"} style={rectOf(c)} {...getResponder(h.id, "move").panHandlers}>
          <View
            style={{
              flex: 1,
              borderWidth: 2,
              borderColor: "#C9B8F0",
              backgroundColor: "rgba(164,137,222,0.28)",
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700", textAlign: "center" }}>
              {h.id}
            </Text>
            <Text numberOfLines={1} style={{ color: "#EDE7F5", fontSize: 8, textAlign: "center" }}>
              {c.x.toFixed(2)},{c.y.toFixed(2)} · {c.w.toFixed(2)}×{c.h.toFixed(2)}
            </Text>
          </View>
        </View>
      );
    });
    // Resize handles as their own top-layer siblings. A child positioned
    // outside its parent's bounds is NOT touchable on iOS, so the handle has to
    // live in the scene container (hit-testable) rather than hang off the box.
    const handles = node.hotspots.map((h) => {
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

  const exportText = node.hotspots
    .map((h) => {
      const c = coordsOf(h);
      return `${h.id}: x ${c.x.toFixed(3)}, y ${c.y.toFixed(3)}, w ${c.w.toFixed(3)}, h ${c.h.toFixed(3)}`;
    })
    .join("\n");

  const sceneInner = (
    <>
      <Image
        source={node.image}
        style={
          isScreenFit
            ? { position: "absolute", left: 0, top: 0, width: SCREEN_W, height: SCREEN_H }
            : { width: SCREEN_W, height: dispH }
        }
        resizeMode="cover"
      />
      {editMode ? renderEditBoxes() : renderHotspots()}
      {!editMode && node.left ? turnArrow("left", node.left) : null}
      {!editMode && node.right ? turnArrow("right", node.right) : null}
      {!editMode && node.back ? turnArrow("back", node.back) : null}
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
