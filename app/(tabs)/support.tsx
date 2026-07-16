import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { CompanionActionZone } from "@/components/ui/CompanionActionZone";
import { SafeArea } from "@/components/ui/SafeArea";
import { headingShadow } from "@/styles";
import { useUnreadTotal } from "@/hooks/useMessages";

/**
 * Support is a calm hub, not a wall of options. Two modes, nothing else:
 * one for a hard moment right now, one for everything else. The first screen
 * should feel almost empty — "you're overwhelmed; that's okay, pick one thing."
 */
export default function SupportScreen() {
  const router = useRouter();
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
      <View className="flex-row items-start justify-between px-6 pt-6 pb-2">
        <Text
          className="text-text-primary text-3xl font-semibold tracking-tight"
          style={headingShadow}
        >
          Support
        </Text>
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

      <View
        className="flex-1 justify-center px-6"
        style={{ gap: 18, marginTop: -40 }}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <Text className="text-text-secondary text-lg leading-relaxed">
            Hard moment or steady recovery — pick one.
          </Text>
        </Animated.View>

        {/* Mode 1 — a hard moment right now */}
        <Animated.View entering={FadeInDown.duration(450).delay(80)}>
          <Pressable
            onPress={() => go("/support/help-now", true)}
            className="bg-urge-surface rounded-3xl px-6 py-8 border border-white/15 active:border-white/35"
            style={{
              shadowColor: "#120D17",
              shadowOpacity: 0.85,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              borderTopColor: "rgba(255,255,255,0.16)",
            }}
          >
            <Text className="text-text-primary text-2xl font-semibold">
              I need help now
            </Text>
            <Text className="text-text-muted text-base mt-2 leading-relaxed">
              A craving, a hard moment. Calm and immediate.
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(500).delay(120)}>
          <CompanionActionZone
            context="support"
            visible={companionMenuOpen}
            onClose={() => setCompanionMenuOpen(false)}
            source={require("../../assets/companions/image_07_tea.png")}
            width={130}
            height={154}
            zoneHeight={companionMenuOpen ? 236 : 164}
            companionLeft={98}
            companionTop={companionMenuOpen ? 72 : 4}
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

        {/* Mode 2 — everything else */}
        <Animated.View entering={FadeInDown.duration(450).delay(160)}>
          <Pressable
            onPress={() => go("/support/recovery")}
            className="bg-surface rounded-3xl px-6 py-8 border border-white/8 active:border-white/20"
            style={{ borderTopColor: "rgba(255,255,255,0.12)" }}
          >
            <Text className="text-text-primary text-2xl font-semibold">
              Recovery
            </Text>
            <Text className="text-text-muted text-base mt-2 leading-relaxed">
              Ongoing support: progress, toolkit, and people when you want them.
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeArea>
  );
}
