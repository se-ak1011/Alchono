import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView, Image, Pressable, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { useCompanion } from "@/hooks/useCompanion";
import { HUB_NODES, HUB_START, type HubAction } from "@/data/hubScene";
import { CaptionBar } from "@/components/home/CaptionBar";
import { HubLoadingScreen } from "@/components/home/HubLoadingScreen";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

// Boot the CD-ROM once per app launch, not on every return to the hub.
let hubBooted = false;

/**
 * The first-person adventure hub. You stand inside a scene and interact with
 * the real things in it — the whole map lives in `src/data/hubScene.ts`, so
 * this engine is art-agnostic: swap the placeholder scenes for Marta's 00s
 * renders and nothing here changes.
 */
export function AdventureHub() {
  const router = useRouter();
  const { pose } = useCompanion();
  const [nodeId, setNodeId] = useState(HUB_START);
  const [caption, setCaption] = useState<string | null>(null);
  const [booted, setBooted] = useState(hubBooted);

  const fade = useRef(new Animated.Value(1)).current;
  const glint = useRef(new Animated.Value(0)).current;
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const node = HUB_NODES[nodeId];

  // A quiet, looping shimmer on the hotspots — the touch-era stand-in for the
  // mouse cursor changing over something clickable. Kept subtle on purpose.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glint, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glint, { toValue: 0, duration: 1600, useNativeDriver: true }),
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

  const imgH = SCREEN_W * (node.imgH / node.imgW);
  const glintOpacity = glint.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  const renderHotspots = (heightPx: number) =>
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
        style={{
          position: "absolute",
          left: h.x * SCREEN_W,
          top: h.y * heightPx,
          width: h.w * SCREEN_W,
          height: h.h * heightPx,
        }}
      >
        <Animated.View
          style={{
            flex: 1,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: "#A489DE",
            opacity: glintOpacity,
          }}
        />
      </Pressable>
    ));

  const renderCompanion = (heightPx: number) => {
    if (!node.companion) return null;
    const c = node.companion;
    const compW = c.width * SCREEN_W;
    const compH = compW * c.wh;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={c.caption}
        onPressIn={() => showCaption(c.caption)}
        onPressOut={clearCaptionSoon}
        onPress={() => {
          showCaption(c.caption);
          runAction(c.action);
        }}
        style={{
          position: "absolute",
          left: c.xCenter * SCREEN_W - compW / 2,
          top: c.feetY * heightPx - compH,
          width: compW,
          height: compH,
        }}
      >
        <CompanionArt source={pose("standing")} width={compW} height={compH} />
      </Pressable>
    );
  };

  const scene =
    node.fit === "screen" ? (
      <View style={{ flex: 1 }}>
        <Image source={node.image} style={{ width: SCREEN_W, height: "100%" }} resizeMode="cover" />
        {renderCompanion(SCREEN_H)}
        {renderHotspots(SCREEN_H)}
      </View>
    ) : (
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ width: SCREEN_W, height: imgH, position: "relative" }}>
          <Image source={node.image} style={{ width: SCREEN_W, height: imgH }} resizeMode="cover" />
          {renderCompanion(imgH)}
          {renderHotspots(imgH)}
        </View>
      </ScrollView>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <Animated.View style={{ flex: 1, opacity: fade }}>{scene}</Animated.View>
      <CaptionBar caption={caption} />
    </View>
  );
}
