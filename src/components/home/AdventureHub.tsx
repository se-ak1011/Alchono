import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView, Image, Pressable, Text, Dimensions, Animated } from "react-native";
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

/**
 * The first-person adventure hub. You stand inside a scene and touch the real
 * things in it. The whole map lives in `src/data/hubScene.ts`, so this engine
 * is art-agnostic: swap the scenes for Marta's period renders and nothing here
 * changes.
 */
export function AdventureHub() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState(HUB_START);
  const [caption, setCaption] = useState<string | null>(null);
  const [booted, setBooted] = useState(hubBooted);
  // Edit mode paints every hotspot as a labelled box (boards included) so the
  // touch zones are visible for alignment. On by default during the design
  // pass; the eye/grid button toggles it. (Flip the default to false for a
  // release build.)
  const [editMode, setEditMode] = useState(true);

  const fade = useRef(new Animated.Value(1)).current;
  const glint = useRef(new Animated.Value(0)).current;
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const node = HUB_NODES[nodeId];

  // A slow breathing pulse for the "glow" affordances — the touch-era
  // stand-in for a mouse cursor changing over something clickable.
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

  // Map the node image onto the screen. For "screen" fit we cover the viewport
  // and place hotspots against the covered image rect, so image-fraction
  // coordinates land on the right objects regardless of device crop.
  const isScreenFit = node.fit === "screen";
  const scale = Math.max(SCREEN_W / node.imgW, SCREEN_H / node.imgH);
  const dispW = isScreenFit ? node.imgW * scale : SCREEN_W;
  const dispH = isScreenFit ? node.imgH * scale : SCREEN_W * (node.imgH / node.imgW);
  const offX = isScreenFit ? (SCREEN_W - dispW) / 2 : 0;
  const offY = isScreenFit ? (SCREEN_H - dispH) / 2 : 0;

  const glowOpacity = glint.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.3] });
  const glowBorder = glint.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.55] });

  const rectOf = (h: Hotspot) => ({
    position: "absolute" as const,
    left: offX + h.x * dispW,
    top: offY + h.y * dispH,
    width: h.w * dispW,
    height: h.h * dispH,
  });

  const affordance = (h: Hotspot) => {
    const kind = h.kind ?? "plain";
    if (kind === "board") {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 }}>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            style={{
              fontFamily: "SkinnyCustard",
              color: "#EFEAF5",
              fontSize: 17,
              lineHeight: 20,
              textAlign: "center",
              textShadowColor: "rgba(0,0,0,0.6)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {h.label ?? h.caption}
          </Text>
        </View>
      );
    }
    if (kind === "glow") {
      return (
        <Animated.View
          style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: "#A489DE",
            opacity: glowOpacity,
          }}
        />
      );
    }
    if (kind === "sign") {
      const bg = h.prominent ? "rgba(59,51,82,0.92)" : "rgba(13,11,18,0.82)";
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bg,
            borderColor: "rgba(190,160,210,0.6)",
            borderWidth: 1,
            borderRadius: h.prominent ? 8 : 4,
            paddingHorizontal: 8,
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: h.prominent ? "SkinnyCustard" : "Inter_500Medium",
              color: "#F0EBF5",
              fontSize: h.prominent ? 20 : 12,
              letterSpacing: h.prominent ? 0.5 : 0.3,
              textTransform: h.prominent ? "uppercase" : "none",
            }}
          >
            {h.label ?? h.caption}
          </Text>
        </View>
      );
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
        style={rectOf(h)}
      >
        {affordance(h)}
      </Pressable>
    ));

  // A visible box + id for every hotspot, for alignment. Non-interactive so the
  // real hotspots underneath still take the taps.
  const renderEditOverlay = () =>
    node.hotspots.map((h) => (
      <View
        key={h.id + "-edit"}
        pointerEvents="none"
        style={{
          ...rectOf(h),
          borderWidth: 2,
          borderColor: "#C9B8F0",
          backgroundColor: "rgba(164,137,222,0.22)",
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text numberOfLines={2} style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700", textAlign: "center" }}>
          {h.id}
        </Text>
      </View>
    ));

  const turnArrow = (dir: "left" | "right" | "back", target: string) => {
    const caption = dir === "back" ? "Back to the café" : dir === "left" ? "Turn left" : "Turn right";
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
        accessibilityLabel={caption}
        onPressIn={() => showCaption(caption)}
        onPressOut={clearCaptionSoon}
        onPress={() => {
          showCaption(caption);
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

  const scene = (
    <View style={{ flex: 1 }}>
      <Image
        source={node.image}
        style={{ position: "absolute", left: 0, top: 0, width: SCREEN_W, height: SCREEN_H }}
        resizeMode="cover"
      />
      {renderHotspots()}
      {editMode ? renderEditOverlay() : null}
      {node.left ? turnArrow("left", node.left) : null}
      {node.right ? turnArrow("right", node.right) : null}
      {node.back ? turnArrow("back", node.back) : null}
    </View>
  );

  const tallScene = (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
      <View style={{ width: SCREEN_W, height: dispH, position: "relative" }}>
        <Image source={node.image} style={{ width: SCREEN_W, height: dispH }} resizeMode="cover" />
        {renderHotspots()}
        {editMode ? renderEditOverlay() : null}
      </View>
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <Animated.View style={{ flex: 1, opacity: fade }}>{isScreenFit ? scene : tallScene}</Animated.View>
      <CaptionBar caption={caption} />

      {/* Design-pass toggle: show/hide the labelled touch-zone boxes. */}
      <Pressable
        onPress={() => setEditMode((v) => !v)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={editMode ? "Hide touch zones" : "Show touch zones"}
        style={{
          position: "absolute",
          top: 52,
          right: 14,
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(13,11,18,0.55)",
          borderWidth: 1,
          borderColor: "rgba(190,160,210,0.4)",
        }}
        className="active:opacity-70"
      >
        <Feather name={editMode ? "eye-off" : "grid"} size={18} color="#EFEAF5" />
      </Pressable>
    </View>
  );
}
