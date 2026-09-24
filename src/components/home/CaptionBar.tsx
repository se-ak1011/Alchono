import React from "react";
import { View, Text, Platform } from "react-native";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;

/**
 * The adventure-game caption bar. Sits along the bottom and names whatever the
 * finger is on — the diegetic replacement for floating labels. It's also the
 * "mercy" layer: nobody has to guess what's clickable or where it leads.
 */
export function CaptionBar({ caption }: { caption: string | null }) {
  if (!caption) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        paddingBottom: 40,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(13,11,18,0.88)",
          borderColor: "rgba(164,137,222,0.5)",
          borderWidth: 1,
          borderRadius: 4,
          paddingVertical: 8,
          paddingHorizontal: 16,
          maxWidth: "92%",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#ECE9F1",
            fontFamily: MONO,
            fontSize: 13,
            letterSpacing: 1,
            textAlign: "center",
          }}
        >
          {caption}
        </Text>
      </View>
    </View>
  );
}
