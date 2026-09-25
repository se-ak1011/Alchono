import React from "react";
import { View, Text, Pressable, Image, ScrollView, Platform, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useCommunityFeed } from "@/hooks/useCommunity";
import { useCommunityMoments, type FeedMoment } from "@/hooks/useMoments";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;
const PLUM = "#A489DE";
const { width: SCREEN_W } = Dimensions.get("window");
const VID_W = Math.min(150, (SCREEN_W - 48) / 2.4);

/**
 * The Community board, zoomed into. Instead of navigating to the Community room
 * this peeks its two content types in place — recent Posts (Talk) and Videos
 * (video moments from the Look wall) — pulled live from the backend. Tapping any
 * item, or "see all", takes you into the full room on the right tab.
 */
export function CommunityPreview({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: feed, isLoading: postsLoading } = useCommunityFeed();
  const { data: moments, isLoading: vidsLoading } = useCommunityMoments();

  const posts = (feed?.pages?.[0] ?? []).slice(0, 3);
  const videos = (moments ?? []).filter((m) => m.media_type === "video").slice(0, 8);

  const go = (path: string, params?: Record<string, string>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push(params ? ({ pathname: path, params } as any) : (path as any));
  };

  const openVideo = (m: FeedMoment) =>
    go("/moments/play", {
      uri: m.url ?? "",
      momentId: m.id,
      type: "video",
      poster: m.thumb_url ?? "",
      caption: m.caption ?? "",
      captionPos: m.caption_position ?? "",
    });

  return (
    <View style={{ flex: 1, backgroundColor: "#201D28", paddingTop: insets.top + 10 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "PatrickHand", fontSize: 22, color: "#ECE9F1" }}>Community</Text>
          <Text style={{ fontFamily: MONO, fontSize: 11.5, color: "#817B91", marginTop: 3 }}>
            a peek at the board
          </Text>
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

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        {/* Videos */}
        <SectionHeader label="Videos" onSeeAll={() => go("/community", { tab: "look" })} />
        {vidsLoading ? (
          <Placeholder text="loading videos…" />
        ) : videos.length === 0 ? (
          <Placeholder text="no videos on the wall yet" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {videos.map((m) => (
              <Pressable key={m.id} onPress={() => openVideo(m)} className="active:opacity-90" style={{ width: VID_W }}>
                <View style={{ position: "relative" }}>
                  {m.thumb_url ? (
                    <Image
                      source={{ uri: m.thumb_url }}
                      style={{ width: VID_W, height: VID_W, borderRadius: 10, backgroundColor: "#2a2533" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: VID_W, height: VID_W, borderRadius: 10, backgroundColor: "#2a2533", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontFamily: MONO, fontSize: 10, color: "#817B91" }}>developing…</Text>
                    </View>
                  )}
                  <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
                      <Feather name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
                    </View>
                  </View>
                </View>
                {m.caption ? (
                  <Text numberOfLines={1} style={{ color: "#B2ACC0", fontSize: 12, marginTop: 6 }}>
                    {m.caption}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Posts */}
        <View style={{ height: 22 }} />
        <SectionHeader label="Posts" onSeeAll={() => go("/community", { tab: "talk" })} />
        {postsLoading ? (
          <Placeholder text="loading posts…" />
        ) : posts.length === 0 ? (
          <Placeholder text="no posts yet — be the first" />
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {posts.map((p: any) => (
              <Pressable
                key={p.id}
                onPress={() => go("/community", { tab: "talk", post: String(p.id) })}
                className="active:opacity-80"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(236,233,241,0.10)",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <Text numberOfLines={3} style={{ color: "#ECE9F1", fontSize: 14.5, lineHeight: 20 }}>
                  {p.content}
                </Text>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: "#817B91", marginTop: 8 }}>
                  {p.is_anonymous || !p.username ? "anon" : `@${p.username}`}
                  {"  ·  "}
                  {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {typeof p.comment_count === "number" ? `  ·  ${p.comment_count} replies` : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Drop in */}
        <Pressable
          onPress={() => go("/community")}
          className="active:opacity-85"
          style={{
            alignSelf: "center",
            marginTop: 24,
            paddingHorizontal: 22,
            paddingVertical: 12,
            borderRadius: 24,
            backgroundColor: PLUM,
          }}
        >
          <Text style={{ fontFamily: "PatrickHand", fontSize: 14, color: "#1a1622" }}>Drop in</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label, onSeeAll }: { label: string; onSeeAll: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 10 }}>
      <Text style={{ fontFamily: "PatrickHand", fontSize: 14, color: "#C6B2F0" }}>{label}</Text>
      <Pressable onPress={onSeeAll} hitSlop={8} className="active:opacity-70">
        <Text style={{ fontFamily: MONO, fontSize: 11.5, color: "#817B91" }}>see all ›</Text>
      </Pressable>
    </View>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <Text style={{ fontFamily: MONO, fontSize: 12, color: "#6b6478", paddingHorizontal: 20, paddingVertical: 10 }}>
      {text}
    </Text>
  );
}
