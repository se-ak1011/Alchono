import React, { useEffect, useRef } from "react";
import { View, Image, Text, Animated, Easing, StyleSheet, Platform } from "react-native";

const SPLASH = require("../../../assets/Splash_Screen.png");
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;

// How much of the screen height the splash art takes; the loader sits beneath.
// Both are easy to nudge if the balance wants tuning.
const IMAGE_HEIGHT_FRACTION = 0.7;
const LOADER_TOP_FRACTION = 0.76;

/**
 * The cold-launch splash. Keeps the existing brand image, but re-laid-out so a
 * 00s-style loader lives underneath it — a spinning ring + "LOADING…", styled
 * to rhyme with the CD-ROM boot in the hub, so the whole app shares one
 * loading language.
 */
export function AppSplash({ width, height }: { width: number; height: number }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const imageH = Math.round(height * IMAGE_HEIGHT_FRACTION);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#201D28", alignItems: "center" }]}>
      <Image source={SPLASH} style={{ width, height: imageH }} resizeMode="contain" />

      <View style={{ position: "absolute", top: Math.round(height * LOADER_TOP_FRACTION), alignItems: "center" }}>
        {/* Spinning ring — the indeterminate 00s loader, echoing the CD boot. */}
        <Animated.View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 2,
            borderColor: "rgba(164,137,222,0.3)",
            borderTopColor: "#A489DE",
            transform: [{ rotate }],
            marginBottom: 12,
          }}
        />
        <Text style={{ color: "#817B91", fontFamily: MONO, fontSize: 11, letterSpacing: 2 }}>LOADING…</Text>
      </View>
    </View>
  );
}
