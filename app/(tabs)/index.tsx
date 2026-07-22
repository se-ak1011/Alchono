import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Animated as RNAnimated,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { AppDrawer } from "@/components/ui/AppDrawer";
import { PauseModal } from "@/components/home/PauseModal";
import { useSmartReminder } from "@/hooks/useSmartReminder";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useDrinkIntentSync } from "@/hooks/useDrinkIntentSync";
import { useActiveSession } from "@/hooks/useDrinkingSession";
import { useCompanion } from "@/hooks/useCompanion";
import { useAuthStore } from "@/store/authStore";
import { ORBIT_ZONES, ZONES, type Zone } from "@/lib/zones";
import { headingShadow } from "@/styles";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

// Gentle lines the companion offers when tapped — presence, not tasks.
const QUIET_LINES = [
  "Still here.",
  "One step at a time.",
  "No rush.",
  "You've done harder things.",
  "Glad you came by.",
  "I'm not going anywhere.",
];

function OrbitChip({ zone, style }: { zone: Zone; style: any }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(zone.route as any);
      }}
      style={[{ position: "absolute", width: 96, alignItems: "center", zIndex: 10 }, style]}
      className="active:opacity-70"
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: zone.tint,
          borderWidth: 1,
          borderColor: zone.edge,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
        }}
      >
        <Text style={{ fontSize: 25 }}>{zone.emoji}</Text>
      </View>
      <Text className="text-text-secondary text-xs font-semibold text-center mt-1.5">
        {zone.label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { pose, companion } = useCompanion();
  const { height } = useWindowDimensions();
  const username = useAuthStore((s) => s.profile?.username);
  const { data: activeSession } = useActiveSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const captionOpacity = useRef(new RNAnimated.Value(0)).current;
  const lastLine = useRef<string | null>(null);

  useSmartReminder();
  useWidgetSync();
  useDrinkIntentSync();

  // Vertical anchors as fractions of the available height, so the orbit keeps
  // its shape from small phones to tall ones.
  const rows = useMemo(
    () => ({
      top: height * 0.26,
      mid: height * 0.46,
      low: height * 0.64,
    }),
    [height],
  );

  const showQuietLine = () => {
    const pool = QUIET_LINES.filter((l) => l !== lastLine.current);
    const line = pool[Math.floor(Math.random() * pool.length)] ?? QUIET_LINES[0];
    lastLine.current = line;
    setCaption(line);
    captionOpacity.stopAnimation();
    captionOpacity.setValue(0);
    RNAnimated.sequence([
      RNAnimated.timing(captionOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      RNAnimated.delay(2400),
      RNAnimated.timing(captionOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => setCaption(null));
  };

  const urge = ZONES.urge;

  return (
    <SafeArea>
      <View style={{ flex: 1, position: "relative" }}>
        {/* Header: hamburger + brand mark */}
        <View className="flex-row items-center justify-between px-6 pt-3">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDrawerOpen(true);
            }}
            hitSlop={12}
            className="p-1 -ml-1 active:opacity-60"
            accessibilityLabel="Open menu"
          >
            <Feather name="menu" size={24} color="#B2ACC0" />
          </Pressable>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: "#A489DE",
              opacity: 0.9,
            }}
          />
        </View>

        {/* Greeting */}
        <View className="items-center mt-3">
          <Text
            className="text-text-primary text-2xl font-semibold tracking-tight"
            style={headingShadow}
          >
            {greeting()}{username ? `, ${username}.` : "."}
          </Text>
          <Text className="text-text-muted text-sm mt-1">
            {companion.name} is here with you.
          </Text>
        </View>

        {/* Companion, centred */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: height * 0.5 - 150,
            alignItems: "center",
            zIndex: 5,
          }}
          pointerEvents="box-none"
        >
          {caption ? (
            <RNAnimated.View
              style={{
                opacity: captionOpacity,
                marginBottom: 8,
                backgroundColor: "#383243",
                borderColor: "rgba(236,233,241,0.13)",
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text className="text-text-secondary text-sm">{caption}</Text>
            </RNAnimated.View>
          ) : null}
          <CompanionArt
            source={pose("bust")}
            width={230}
            height={272}
            cropHeight={232}
            onPress={showQuietLine}
          />
        </View>

        {/* Orbit chips */}
        <OrbitChip zone={ORBIT_ZONES[0]} style={{ left: 22, top: rows.top }} />
        <OrbitChip zone={ORBIT_ZONES[1]} style={{ right: 22, top: rows.top }} />
        <OrbitChip zone={ORBIT_ZONES[2]} style={{ left: 6, top: rows.mid }} />
        <OrbitChip zone={ORBIT_ZONES[3]} style={{ right: 6, top: rows.mid }} />
        <OrbitChip zone={ORBIT_ZONES[4]} style={{ left: 42, top: rows.low }} />
        <OrbitChip zone={ORBIT_ZONES[5]} style={{ right: 42, top: rows.low }} />

        {/* The one bold thing — always at the base, always findable.
            When a session is live, a slim chip sits just above it. */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{ position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center" }}
        >
          {activeSession ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/session/track");
              }}
              className="flex-row items-center gap-2 mb-3 active:opacity-80"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: "#060708",
                borderWidth: 1,
                borderColor: "rgba(236,233,241,0.14)",
              }}
            >
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#C98282" }} />
              <Text className="text-text-secondary text-sm font-medium">
                Session on
                {typeof (activeSession as any).drinks_count === "number"
                  ? ` · ${(activeSession as any).drinks_count} ${
                      (activeSession as any).drinks_count === 1 ? "drink" : "drinks"
                    }`
                  : ""}
              </Text>
              <Feather name="chevron-right" size={15} color="#817B91" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.push(urge.route as any);
            }}
            className="flex-row items-center gap-2.5 active:opacity-80"
            style={{
              paddingHorizontal: 24,
              paddingVertical: 15,
              borderRadius: 30,
              backgroundColor: urge.tint,
              borderWidth: 1,
              borderColor: urge.edge,
              shadowColor: "#120D17",
              shadowOpacity: 0.8,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 7 },
            }}
          >
            <Text style={{ fontSize: 19 }}>{urge.emoji}</Text>
            <Text className="text-text-primary text-base font-bold">
              {urge.label}
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      <PauseModal />
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeArea>
  );
}
