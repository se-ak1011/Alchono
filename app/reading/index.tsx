import React from "react";
import { View, Text, Pressable, ImageBackground, FlatList, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BOOKS } from "@/data/books";
import { CATEGORY_ORDER, type ToolkitCategory } from "@/lib/toolkit";

/**
 * The magazine carousel — the stack from the reading-corner table. Swipe through
 * the covers (like the drinks); tap one to open its spread (the articles are
 * chosen on the cover now — no contents menu). Reached from /reading/table.
 */
export default function ReadingCarousel() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const cats = CATEGORY_ORDER.filter((c) => BOOKS[c]);

  const open = (c: ToolkitCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/reading/${c}` as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <FlatList
        data={cats}
        keyExtractor={(c) => c}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} style={{ width, height }}>
            <ImageBackground source={BOOKS[item]!.cover} style={{ width, height }} resizeMode="contain">
              <View pointerEvents="none" style={{ position: "absolute", bottom: height * 0.055, left: 0, right: 0, alignItems: "center" }}>
                <Text style={{ color: "rgba(236,233,241,0.65)", fontSize: 13, fontFamily: "PatrickHand" }}>tap to open · swipe for more</Text>
              </View>
            </ImageBackground>
          </Pressable>
        )}
      />
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: "absolute", top: 52, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(13,11,18,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}
      >
        <Feather name="arrow-left" size={20} color="#ECE9F1" />
      </Pressable>
    </View>
  );
}
