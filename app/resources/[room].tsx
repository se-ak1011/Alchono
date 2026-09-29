import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ImageBackground, Linking, useWindowDimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { RESOURCE_BOOKS, type ResourceTab } from "@/data/resourceBooks";
import { RESOURCE_SECTIONS, type Resource } from "@/lib/resources";
import { PageTuner } from "@/components/reader/PageTuner";

const INK = "#332a24";
const INK_SOFT = "#6a5d52";

const TABS: ResourceTab[] = ["call", "text", "meetings"];

// Which services live under each thumb-tab (same grouping as the Resources
// screen). Titles resolve against RESOURCE_SECTIONS.
const TAB_TITLES: Record<ResourceTab, string[]> = {
  call: ["Emergency — 999", "Samaritans", "NHS 111", "Drinkline", "Alcoholics Anonymous"],
  text: ["Shout", "NHS alcohol advice", "7 Cups"],
  meetings: ["AA meeting finder", "SMART Recovery UK"],
};

// The three drawn tabs down the right edge of the open spread (fractions of the
// screen). Rough — nudge once against a screenshot, they hold for every room.
const TAB_RECTS: Record<ResourceTab, { top: number; height: number }> = {
  call: { top: 0.36, height: 0.075 },
  text: { top: 0.44, height: 0.075 },
  meetings: { top: 0.52, height: 0.085 },
};

// Default text zone on the open spread (fractions of screen), tuned in-app.
// Each Call/Text/Meetings list fits one page, so 0.80× reads cleanly.
const PAGE = { left: 0.086, top: 0.336, width: 0.72, height: 0.24 };
const PAGE_FONT = 0.8;

function openResource(r: Resource, router: ReturnType<typeof useRouter>) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  if (r.url.startsWith("internal:")) router.push(r.url.replace("internal:", "") as any);
  else Linking.openURL(r.url).catch(() => {});
}

export default function ResourceBookScreen() {
  const { room } = useLocalSearchParams<{ room: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const art = RESOURCE_BOOKS[room ?? "home"];

  const [phase, setPhase] = useState<"cover" | "open">("cover");
  const [tab, setTab] = useState<ResourceTab>("call");

  // No drawn directory for this landline yet — fall back to the plain screen.
  useEffect(() => {
    if (!art) router.replace("/support/resources" as any);
  }, [art, router]);
  if (!art) return <View style={{ flex: 1, backgroundColor: "#0d0b12" }} />;

  const byTitle = Object.fromEntries(
    RESOURCE_SECTIONS.flatMap((s) => s.items).map((r) => [r.title, r] as const),
  );
  const items = TAB_TITLES[tab].map((t) => byTitle[t]).filter(Boolean) as Resource[];

  const selectTab = (t: ResourceTab) => {
    if (t === tab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTab(t);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <Pressable
        style={{ flex: 1 }}
        onPress={phase === "cover" ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPhase("open"); } : undefined}
      >
        <ImageBackground source={phase === "cover" ? art.cover : art.tabs[tab]} style={{ flex: 1 }} resizeMode="cover">
          {phase === "cover" ? (
            <Animated.View entering={FadeIn.duration(400).delay(200)} style={{ position: "absolute", bottom: height * 0.24, left: 0, right: 0, alignItems: "center" }} pointerEvents="none">
              <Text style={{ color: "rgba(236,233,241,0.7)", fontSize: 13, fontFamily: "PatrickHand" }}>tap to open</Text>
            </Animated.View>
          ) : (
            <>
              <PageTuner label={`resources (${room ?? "home"})`} defaultZone={PAGE} defaultFontScale={PAGE_FONT} contentKey={tab}>
                {(fs) => (
                  <View style={{ paddingHorizontal: 4 }}>
                    {items.map((r) => (
                      <Pressable key={r.title} onPress={() => openResource(r, router)} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(51,42,36,0.14)" }}>
                        <Text style={{ color: INK, fontSize: 15 * fs, fontFamily: "PatrickHand" }}>{r.title}</Text>
                        <Text style={{ color: INK_SOFT, fontSize: 11 * fs }} numberOfLines={1}>{r.action}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </PageTuner>

              {/* Invisible tap zones over the drawn thumb-tabs. */}
              {TABS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => selectTab(t)}
                  style={{ position: "absolute", right: 0, width: width * 0.16, top: height * TAB_RECTS[t].top, height: height * TAB_RECTS[t].height }}
                />
              ))}
            </>
          )}
        </ImageBackground>
      </Pressable>

      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
        hitSlop={12}
        style={{ position: "absolute", top: 52, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(13,11,18,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}
      >
        <Feather name="arrow-left" size={20} color="#ECE9F1" />
      </Pressable>
    </View>
  );
}
