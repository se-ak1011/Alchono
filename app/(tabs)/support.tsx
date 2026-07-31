import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { CompanionActionZone } from "@/components/ui/CompanionActionZone";
import { SafeArea } from "@/components/ui/SafeArea";
import { ZoneGlow } from "@/components/ui/ZoneGlow";
import { headingShadow } from "@/styles";
import { useUnreadTotal } from "@/hooks/useMessages";
import { useCompanion } from "@/hooks/useCompanion";

/**
 * Support is a calm hub, not a wall of options. Two modes, nothing else:
 * one for a hard moment right now, one for everything else. The first screen
 * should feel almost empty — "you're overwhelmed; that's okay, pick one thing."
 */
export default function SupportScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const [companionMenuOpen, setCompanionMenuOpen] = useState(false);
  const [quietCompanionSignal, setQuietCompanionSignal] = useState(0);
  const { data: unread } = useUnreadTotal();

  const go = (route: string, warn = false) => {
    if (warn)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

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

      {/* Companion + chips only — the two big cards ("I need help now",
          "Recovery") were duplicated by the companion's chips, so they're gone.
          Chips not cards. */}
      <View className="flex-1 justify-center px-6">
        <Animated.View entering={FadeIn.duration(500).delay(120)}>
          <CompanionActionZone
            context="support"
            visible={companionMenuOpen}
            onClose={() => setCompanionMenuOpen(false)}
            source={pose("tea")}
            width={174}
            height={206}
            zoneHeight={250}
            companionLeft={76}
            companionTop={32}
            points={[
              { x: -92, y: -56 },
              { x: 92, y: -56 },
              { x: -100, y: 52 },
              { x: 100, y: 52 },
            ]}
            caption={{ x: 0, y: -96 }}
            onPress={() => setCompanionMenuOpen(true)}
            onLongPress={() => {
              if (!companionMenuOpen)
                setQuietCompanionSignal((signal) => signal + 1);
            }}
            quietSignal={quietCompanionSignal}
          />
        </Animated.View>
      </View>

    </SafeArea>
  );
}
