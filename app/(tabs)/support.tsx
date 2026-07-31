import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { OrbitChip } from "@/components/ui/OrbitChip";
import { SafeArea } from "@/components/ui/SafeArea";
import { ZoneGlow } from "@/components/ui/ZoneGlow";
import { headingShadow } from "@/styles";
import { useUnreadTotal } from "@/hooks/useMessages";
import { useCompanion } from "@/hooks/useCompanion";

/**
 * Support mirrors Home: the companion sits front and centre with her
 * destinations always orbiting her — nothing hidden behind a tap. You land on
 * a full, warm frame, not a small figure marooned in empty space. "I want a
 * drink" anchors bottom-centre, under her, exactly like Home's emergency chip.
 */
export default function SupportScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const { data: unread } = useUnreadTotal();

  const go = (route: string, warn = false) => {
    if (warn)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const companionTop = 96;

  return (
    <SafeArea>
      <ZoneGlow zone="support" />
      <View className="px-6 pt-6 pb-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="p-1 -ml-1 active:opacity-60"
            >
              <Feather name="chevron-left" size={26} color="#B2ACC0" />
            </Pressable>
            <Text
              className="text-text-primary text-4xl tracking-tight"
              style={headingShadow}
            >
              Support
            </Text>
          </View>
          <Pressable
            onPress={() => go("/messages")}
            hitSlop={8}
            className="flex-row items-center gap-2 bg-surface rounded-xl px-3.5 py-2.5 border border-white/8 active:border-white/20"
          >
            <Text className="text-text-secondary text-sm font-medium">
              Messages
            </Text>
            {!!unread && (
              <View className="bg-accent rounded-full min-w-5 h-5 px-1.5 items-center justify-center">
                <Text className="text-bg text-xs font-bold">{unread}</Text>
              </View>
            )}
          </Pressable>
        </View>
        <Text className="text-text-secondary text-lg leading-relaxed mt-3">
          Rough patch or steady day — I'm here for both.
        </Text>
      </View>

      {/* Always-visible orbit, like Home. Companion centred; AI Coach above,
          Community left, Recovery right, "I want a drink" tucked underneath. */}
      <Animated.View entering={FadeIn.duration(500).delay(120)} className="flex-1">
        <View style={{ height: 470, position: "relative", marginTop: 8 }}>
          <View style={{ position: "absolute", left: 0, right: 0, top: companionTop, alignItems: "center", zIndex: 5 }} pointerEvents="none">
            <CompanionArt source={pose("tea")} width={212} height={262} />
          </View>

          <View style={{ position: "absolute", left: 0, right: 0, top: companionTop - 44, alignItems: "center", zIndex: 10 }}>
            <OrbitChip label="AI Coach" onPress={() => go("/support/coach")} />
          </View>
          <View style={{ position: "absolute", left: 20, top: companionTop + 104, zIndex: 10 }}>
            <OrbitChip label="Community" onPress={() => go("/community")} />
          </View>
          <View style={{ position: "absolute", right: 20, top: companionTop + 104, zIndex: 10 }}>
            <OrbitChip label="Recovery" onPress={() => go("/support/recovery")} />
          </View>
          <View style={{ position: "absolute", left: 0, right: 0, top: companionTop + 250, alignItems: "center", zIndex: 10 }}>
            <OrbitChip label="I want a drink" emergency onPress={() => go("/session/urge", true)} />
          </View>
        </View>
      </Animated.View>
    </SafeArea>
  );
}
