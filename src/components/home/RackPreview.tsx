import React from "react";
import { View, Text, Pressable, ScrollView, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" }) as string;
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;
const PAPER = "#e7e1d2";
const INK = "#2b2620";

// The three papers on the rack, in the order they hang. Kept in step with the
// left-view hotspots (l_papers / l_papers2 / l_papers3) in hubScene.ts.
const PAPERS: ReadonlyArray<{ eyebrow: string; title: string; teaser: string; route: string }> = [
  {
    eyebrow: "FOOD FOR THE SOUL",
    title: "The Good News Gazette",
    teaser: "Kind things happening in the world today — proof it isn't all heavy.",
    route: "/soul",
  },
  {
    eyebrow: "HAVE A GIGGLE",
    title: "The Funny Pages",
    teaser: "A daily strip and a few dumb jokes. Permission to laugh.",
    route: "/giggles",
  },
  {
    eyebrow: "LETTERS & THOUGHTS",
    title: "The Letters Page",
    teaser: "Words worth sitting with — a thought to carry into the day.",
    route: "/thought",
  },
];

/**
 * The newspaper rack, peeked from the reading corner. The three papers hang one
 * under the other as clippings; tap one to read it in full.
 */
export function RackPreview({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push(route as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#201D28", paddingTop: insets.top + 10 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "PatrickHand", fontSize: 22, color: "#ECE9F1" }}>The Rack</Text>
          <Text style={{ fontFamily: MONO, fontSize: 11.5, color: "#817B91", marginTop: 3 }}>today&apos;s papers</Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(236,233,241,0.14)",
          }}
        >
          <Feather name="x" size={20} color="#EFEAF5" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 28, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {PAPERS.map((p, i) => (
          <Animated.View key={p.route} entering={FadeInDown.duration(320).delay(Math.min(i * 70, 300))} style={{ transform: [{ rotate: i % 2 === 0 ? "-0.5deg" : "0.5deg" }] }}>
            <Pressable
              onPress={() => go(p.route)}
              accessibilityRole="button"
              accessibilityLabel={`${p.title}. ${p.teaser}`}
              className="active:opacity-90"
              style={{
                backgroundColor: PAPER,
                borderRadius: 3,
                paddingHorizontal: 18,
                paddingTop: 14,
                paddingBottom: 16,
                shadowColor: "#000",
                shadowOpacity: 0.42,
                shadowRadius: 9,
                shadowOffset: { width: 0, height: 5 },
              }}
            >
              <Text style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: 2, color: "rgba(0,0,0,0.5)" }}>{p.eyebrow}</Text>
              <Text style={{ fontFamily: SERIF, fontWeight: "700", fontSize: 22, lineHeight: 26, color: INK, marginTop: 4 }}>
                {p.title}
              </Text>
              <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.22)", marginTop: 9, marginBottom: 9 }} />
              <Text style={{ fontFamily: SERIF, fontSize: 14.5, lineHeight: 21, color: "rgba(0,0,0,0.76)" }}>{p.teaser}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12 }}>
                <Text style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: "rgba(0,0,0,0.55)" }}>READ</Text>
                <Feather name="arrow-right" size={12} color="rgba(0,0,0,0.55)" />
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
