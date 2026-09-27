import React, { useEffect, useRef } from "react";
import { View, Image, Text, Animated, Easing, StyleSheet, Platform } from "react-native";

const SPLASH = require("../../../assets/Splash_Screen.png");
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;

// A soft drop shadow so the loader stays legible over the bright sunset art.
const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.7,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
} as const;

/**
 * The cold-launch splash — now the *only* boot screen. The brand image fills the
 * screen edge-to-edge (full-bleed — it's already phone-shaped), with the 00s
 * CD-ROM loader (spinning disc, ALCHONO wordmark, progress bar) superposed over
 * it near the bottom. This replaced the two-screen flow (plain splash → separate
 * CD-ROM boot in the hub) with a single screen before the app opens.
 */
export function AppSplash({ width, height }: { width: number; height: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    // Fill toward — but not quite to — full, and hold. The screen is dismissed
    // externally once fonts + auth are ready, so the bar should read as "still
    // loading" rather than falsely completing.
    Animated.timing(progress, {
      toValue: 1,
      duration: 1900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => loop.stop();
  }, [spin, progress]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["6%", "92%"] });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#201D28" }]}>
      {/* Full-bleed brand image */}
      <Image source={SPLASH} style={{ width, height }} resizeMode="cover" />

      {/* CD-ROM loader over the image, near the bottom */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          paddingBottom: 64,
          paddingHorizontal: 40,
        }}
      >
        {/* The faux disc, spinning up */}
        <Animated.View
          style={[
            {
              width: 68,
              height: 68,
              borderRadius: 34,
              borderWidth: 2,
              borderColor: "rgba(216,204,244,0.85)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              transform: [{ rotate }],
            },
            SHADOW,
          ]}
        >
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "rgba(216,204,244,0.85)" }} />
          <View style={{ position: "absolute", top: 8, width: 2, height: 15, backgroundColor: "rgba(255,255,255,0.7)" }} />
        </Animated.View>

        <Text
          style={{
            fontFamily: "PatrickHand",
            fontSize: 34,
            lineHeight: 42,
            color: "#F4EFFA",
            letterSpacing: 2,
            marginBottom: 18,
            textShadowColor: "rgba(0,0,0,0.85)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 8,
          }}
        >
          ALCHONO
        </Text>

        <View
          style={[
            {
              width: "100%",
              maxWidth: 260,
              height: 12,
              borderWidth: 1,
              borderColor: "rgba(216,204,244,0.8)",
              borderRadius: 3,
              padding: 2,
              backgroundColor: "rgba(13,11,18,0.45)",
              overflow: "hidden",
            },
            SHADOW,
          ]}
        >
          <Animated.View style={{ height: "100%", width: barWidth, backgroundColor: "#B197E4", borderRadius: 1 }} />
        </View>

        <Text
          style={{
            marginTop: 12,
            color: "#EDE7F5",
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: 2,
            textShadowColor: "rgba(0,0,0,0.85)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 5,
          }}
        >
          LOADING…
        </Text>
      </View>
    </View>
  );
}
