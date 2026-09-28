import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ImageBackground, useWindowDimensions } from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BOOKS } from "@/data/books";
import { TOOLKIT, CATEGORY_META, type ToolkitCategory, type ToolSection } from "@/lib/toolkit";

const INK = "#332a24"; // warm dark ink on the cream page
const INK_SOFT = "#6a5d52";

// The open book sits in a band across the middle of the spread art (the rest is
// the shelf around it). Text is painted into the two page zones. These are
// fractions of the screen — nudge them once, they hold for every book since the
// spreads are all drawn from the same template.
const PAGE = { top: 0.375, bottom: 0.6, left: 0.075, right: 0.075, spineGap: 0.06 };

function Section({ s }: { s: ToolSection }) {
  switch (s.type) {
    case "heading":
      return <Text style={{ color: INK, fontFamily: "PatrickHand", fontSize: 17, marginTop: 10, marginBottom: 3 }}>{s.text}</Text>;
    case "paragraph":
      return <Text style={{ color: INK, fontSize: 12.5, lineHeight: 18, marginBottom: 7 }}>{s.text}</Text>;
    case "callout":
      return <Text style={{ color: INK_SOFT, fontSize: 12, lineHeight: 17, marginBottom: 7, fontStyle: "italic" }}>{s.text}</Text>;
    case "steps":
      return (
        <View style={{ marginBottom: 7, gap: 3 }}>
          {s.items.map((it, i) => (
            <Text key={i} style={{ color: INK, fontSize: 12.5, lineHeight: 18 }}>{`${i + 1}.  ${it}`}</Text>
          ))}
        </View>
      );
    case "list":
    case "lines":
      return (
        <View style={{ marginBottom: 7, gap: 3 }}>
          {s.items.map((it, i) => (
            <Text key={i} style={{ color: INK, fontSize: 12.5, lineHeight: 18 }}>{`•  ${it}`}</Text>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export default function BookReaderScreen() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const category = cat as ToolkitCategory;
  const art = BOOKS[category];
  const meta = CATEGORY_META[category];
  const articles = TOOLKIT.filter((t) => t.category === category);

  const [phase, setPhase] = useState<"cover" | "contents" | "article">("cover");
  const [idx, setIdx] = useState(0);

  // No drawn book yet for this category — behave exactly as the old shelf did.
  useEffect(() => {
    if (!art) router.replace(`/toolkit/c/${category}` as any);
  }, [art, category, router]);
  if (!art) return <View style={{ flex: 1, backgroundColor: "#0d0b12" }} />;

  const pageTop = height * PAGE.top;
  const pageHeight = height * (PAGE.bottom - PAGE.top);
  const pageLeft = width * PAGE.left;
  const pageRight = width * PAGE.right;

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === "article") setPhase("contents");
    else router.back();
  };

  const openArticle = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIdx(i);
    setPhase("article");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      {/* The book. Cover first; tap it to open to the spread. */}
      <Pressable
        style={{ flex: 1 }}
        onPress={phase === "cover" ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPhase("contents"); } : undefined}
      >
        <ImageBackground source={phase === "cover" ? art.cover : art.open} style={{ flex: 1 }} resizeMode="cover">
          {phase === "cover" ? (
            <Animated.View entering={FadeIn.duration(400).delay(200)} style={{ position: "absolute", bottom: height * 0.2, left: 0, right: 0, alignItems: "center" }} pointerEvents="none">
              <Text style={{ color: "rgba(236,233,241,0.7)", fontSize: 13, fontFamily: "PatrickHand" }}>tap to open</Text>
            </Animated.View>
          ) : (
            // The reading surface, painted into the page band of the spread.
            <Animated.View
              key={`${phase}-${idx}`}
              entering={SlideInRight.duration(260)}
              style={{ position: "absolute", top: pageTop, left: pageLeft, right: pageRight, height: pageHeight }}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 14, paddingHorizontal: width * PAGE.spineGap }}
              >
                {phase === "contents" ? (
                  <>
                    <Text style={{ color: INK, fontFamily: "PatrickHand", fontSize: 22, textAlign: "center", marginBottom: 2 }}>{meta.label}</Text>
                    <Text style={{ color: INK_SOFT, fontSize: 11.5, textAlign: "center", marginBottom: 12 }}>{meta.blurb}</Text>
                    {articles.map((a, i) => (
                      <Pressable key={a.id} onPress={() => openArticle(i)} style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "rgba(51,42,36,0.14)" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ color: INK_SOFT, fontSize: 12, width: 16 }}>{i + 1}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: INK, fontSize: 14, fontFamily: "PatrickHand" }}>{a.title}</Text>
                            <Text style={{ color: INK_SOFT, fontSize: 10.5 }} numberOfLines={1}>{a.minutes} min · {a.teaser}</Text>
                          </View>
                          <Feather name="chevron-right" size={14} color={INK_SOFT} />
                        </View>
                      </Pressable>
                    ))}
                  </>
                ) : (
                  <>
                    <Text style={{ color: INK, fontFamily: "PatrickHand", fontSize: 20, marginBottom: 8 }}>{articles[idx]?.title}</Text>
                    {articles[idx]?.sections.map((s, i) => <Section key={i} s={s} />)}
                    {idx < articles.length - 1 ? (
                      <Pressable onPress={() => openArticle(idx + 1)} style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        <Text style={{ color: INK_SOFT, fontSize: 12, fontFamily: "PatrickHand" }}>next page</Text>
                        <Feather name="chevron-right" size={14} color={INK_SOFT} />
                      </Pressable>
                    ) : null}
                  </>
                )}
              </ScrollView>
            </Animated.View>
          )}
        </ImageBackground>
      </Pressable>

      {/* Back — article→contents, otherwise out to the shelf. */}
      <Pressable
        onPress={goBack}
        hitSlop={12}
        style={{ position: "absolute", top: 52, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(13,11,18,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}
      >
        <Feather name={phase === "article" ? "corner-up-left" : "arrow-left"} size={20} color="#ECE9F1" />
      </Pressable>
    </View>
  );
}
