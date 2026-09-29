import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ImageBackground, useWindowDimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BOOKS } from "@/data/books";
import { TOOLKIT, CATEGORY_META, type ToolkitCategory, type ToolSection } from "@/lib/toolkit";
import { PageTuner } from "@/components/reader/PageTuner";

const INK = "#332a24"; // warm dark ink on the cream page
const INK_SOFT = "#6a5d52";

// Default text zone over the open spread (fractions of screen). Tunable in-app
// via the pencil; once dialled in, one set holds for every book (same template).
const PAGE = { left: 0.075, top: 0.375, width: 0.85, height: 0.225 };

function Section({ s, scale }: { s: ToolSection; scale: number }) {
  const fs = (n: number) => n * scale;
  switch (s.type) {
    case "heading":
      return <Text style={{ color: INK, fontFamily: "PatrickHand", fontSize: fs(16), marginTop: 8, marginBottom: 3 }}>{s.text}</Text>;
    case "paragraph":
      return <Text style={{ color: INK, fontSize: fs(12), lineHeight: fs(17), marginBottom: 6 }}>{s.text}</Text>;
    case "callout":
      return <Text style={{ color: INK_SOFT, fontSize: fs(11.5), lineHeight: fs(16), marginBottom: 6, fontStyle: "italic" }}>{s.text}</Text>;
    case "steps":
      return (
        <View style={{ marginBottom: 6, gap: 2 }}>
          {s.items.map((it, i) => (
            <Text key={i} style={{ color: INK, fontSize: fs(12), lineHeight: fs(17) }}>{`${i + 1}.  ${it}`}</Text>
          ))}
        </View>
      );
    case "list":
    case "lines":
      return (
        <View style={{ marginBottom: 6, gap: 2 }}>
          {s.items.map((it, i) => (
            <Text key={i} style={{ color: INK, fontSize: fs(12), lineHeight: fs(17) }}>{`•  ${it}`}</Text>
          ))}
        </View>
      );
    default:
      return null;
  }
}

// Rough "how much space" a section takes, so an article can be split across the
// two pages without cutting a section in half at the spine.
function weight(s: ToolSection): number {
  if (s.type === "paragraph" || s.type === "callout") return s.text.length + 20;
  if (s.type === "heading") return s.text.length + 40;
  if (s.type === "steps" || s.type === "list" || s.type === "lines") return s.items.reduce((n, it) => n + it.length + 16, 0);
  return 0;
}

/** Fill the left page until roughly half the article is placed, then the right. */
function paginate(sections: ToolSection[], titleWeight: number): [ToolSection[], ToolSection[]] {
  const target = (titleWeight + sections.reduce((n, s) => n + weight(s), 0)) / 2;
  let acc = titleWeight;
  const left: ToolSection[] = [];
  const right: ToolSection[] = [];
  for (const s of sections) {
    if (acc < target) { left.push(s); acc += weight(s); }
    else right.push(s);
  }
  return [left, right];
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

  const spine = width * 0.06; // gutter down the middle, over the book's spine

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
            <PageTuner
              label={`reading (${category})`}
              defaultZone={PAGE}
              defaultFontScale={0.8}
              contentKey={`${phase}-${idx}`}
              scroll={phase === "contents"}
            >
              {(fs) =>
                phase === "contents" ? (
                  <View style={{ paddingHorizontal: 4 }}>
                    <Text style={{ color: INK, fontFamily: "PatrickHand", fontSize: 22 * fs, textAlign: "center", marginBottom: 2 }}>{meta.label}</Text>
                    <Text style={{ color: INK_SOFT, fontSize: 11.5 * fs, textAlign: "center", marginBottom: 12 }}>{meta.blurb}</Text>
                    {articles.map((a, i) => (
                      <Pressable key={a.id} onPress={() => openArticle(i)} style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "rgba(51,42,36,0.14)" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ color: INK_SOFT, fontSize: 12 * fs, width: 16 }}>{i + 1}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: INK, fontSize: 14 * fs, fontFamily: "PatrickHand" }}>{a.title}</Text>
                            <Text style={{ color: INK_SOFT, fontSize: 10.5 * fs }} numberOfLines={1}>{a.minutes} min · {a.teaser}</Text>
                          </View>
                          <Feather name="chevron-right" size={14} color={INK_SOFT} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  (() => {
                    const a = articles[idx];
                    const [left, right] = paginate(a?.sections ?? [], 44);
                    return (
                      <View style={{ flex: 1, flexDirection: "row" }}>
                        {/* Left page. */}
                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10, paddingHorizontal: 4 }}>
                          <Text style={{ color: INK, fontFamily: "PatrickHand", fontSize: 18 * fs, marginBottom: 7 }}>{a?.title}</Text>
                          {left.map((s, i) => <Section key={i} s={s} scale={fs} />)}
                        </ScrollView>
                        <View style={{ width: spine }} />
                        {/* Right page. */}
                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10, paddingHorizontal: 4 }}>
                          {right.map((s, i) => <Section key={i} s={s} scale={fs} />)}
                          {idx < articles.length - 1 ? (
                            <Pressable onPress={() => openArticle(idx + 1)} style={{ marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                              <Text style={{ color: INK_SOFT, fontSize: 12 * fs, fontFamily: "PatrickHand" }}>next page</Text>
                              <Feather name="chevron-right" size={14} color={INK_SOFT} />
                            </Pressable>
                          ) : null}
                        </ScrollView>
                      </View>
                    );
                  })()
                )
              }
            </PageTuner>
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
