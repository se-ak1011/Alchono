import React, { useEffect, useRef } from "react";
import { View, Image, Text, Animated, Easing, StyleSheet, Platform } from "react-native";

const SPLASH = require("../../../assets/Splash_Screen.png");
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;

/**
 * The cold-launch splash. The brand image fills the screen edge-to-edge
 * (full-bleed — it's already phone-shaped), with the 00s loader overlaid *over*
 * it near the bottom, styled to rhyme with the CD-ROM boot in the hub.
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

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#201D28" }]}>
      {/* Full-bleed brand image */}
      <Image source={SPLASH} style={{ width, height }} resizeMode="cover" />

      {/* Loader over the image, near the bottom */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", paddingBottom: 56 }}>
        <Animated.View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 2,
            borderColor: "rgba(164,137,222,0.35)",
            borderTopColor: "#B197E4",
            transform: [{ rotate }],
            marginBottom: 12,
          }}
        />
        <Text
          style={{
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
