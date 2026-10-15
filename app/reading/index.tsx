import React from "react";
import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { SafeArea } from "@/components/ui/SafeArea";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ZoneGlow } from "@/components/ui/ZoneGlow";
import { BOOKS } from "@/data/books";
import { CATEGORY_META, type ToolkitCategory } from "@/lib/toolkit";

// The reading library — the bookshelf, opened. So ONE "bookshelf" hotspot in the
// study takes you to the whole shelf instead of needing a ring on every book.
// Each cover opens its real book (/reading/[cat]).
const SHELF: ToolkitCategory[] = [
  "in-the-moment",
  "understand",
  "triggers",
  "planning-ahead",
  "stress",
  "sleep",
  "relationships",
  "identity",
  "after-a-slip",
];

export default function ReadingLibrary() {
  const router = useRouter();
  return (
    <SafeArea>
      <ZoneGlow zone="me" intensity={0.5} />
      <ScreenHeader title="The bookshelf" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {SHELF.map((cat) => {
            const art = BOOKS[cat];
            const meta = CATEGORY_META[cat];
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/reading/${cat}` as any);
                }}
                style={{ width: "48%", marginBottom: 18 }}
                className="active:opacity-80"
              >
                <View
                  style={{
                    aspectRatio: 0.72,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(190,160,210,0.25)",
                  }}
                >
                  {art?.cover ? (
                    <Image source={art.cover} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
                      <Text style={{ color: "#E9DEFF", fontFamily: "PatrickHand", fontSize: 18, textAlign: "center" }}>
                        {meta?.label ?? cat}
                      </Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} style={{ color: "#ECE9F1", fontSize: 13, fontWeight: "600", marginTop: 6 }}>
                  {meta?.label ?? cat}
                </Text>
                <Text numberOfLines={1} style={{ color: "#8b849b", fontSize: 11 }}>
                  {meta?.blurb ?? ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeArea>
  );
}
