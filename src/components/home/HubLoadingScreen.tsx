import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Platform, Easing } from "react-native";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;

/**
 * The CD-ROM boot. The disc spins up, a chunky progress bar fills, then you're
 * dropped into the hub. Tap anywhere to skip. Shown once per app launch.
 */
export function HubLoadingScreen({ onDone }: { onDone: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

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
    Animated.timing(progress, {
      toValue: 1,
      duration: 1700,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setTimeout(finish, 200);
    });
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["4%", "100%"] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Pressable
      onPress={finish}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#0d0b12",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      {/* The faux disc, spinning up */}
      <Animated.View
        style={{
          width: 92,
          height: 92,
          borderRadius: 46,
          borderWidth: 2,
          borderColor: "rgba(164,137,222,0.5)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 34,
          transform: [{ rotate }],
        }}
      >
        <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "rgba(164,137,222,0.5)" }} />
        <View style={{ position: "absolute", top: 10, width: 2, height: 20, backgroundColor: "rgba(236,233,241,0.35)" }} />
      </Animated.View>

      <Text style={{ fontFamily: "Bungee", fontSize: 40, lineHeight: 50, color: "#ECE9F1", letterSpacing: 2, marginBottom: 22 }}>
        ALCHONO
      </Text>

      <View
        style={{
          width: "100%",
          maxWidth: 300,
          height: 14,
          borderWidth: 1,
          borderColor: "rgba(164,137,222,0.55)",
          borderRadius: 3,
          padding: 2,
          backgroundColor: "rgba(255,255,255,0.03)",
        }}
      >
        <Animated.View style={{ height: "100%", width: barWidth, backgroundColor: "#A489DE", borderRadius: 1 }} />
      </View>
      <Text style={{ marginTop: 12, color: "#817B91", fontFamily: MONO, fontSize: 11, letterSpacing: 1 }}>LOADING…</Text>
    </Pressable>
  );
}
