import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { OrbitChip } from "@/components/ui/OrbitChip";
import { AppDrawer } from "@/components/ui/AppDrawer";
import { PauseModal } from "@/components/home/PauseModal";
import { FoodCards } from "@/components/home/FoodCards";
import { HomeStories } from "@/components/home/HomeStories";
import { HomeFeed } from "@/components/home/HomeFeed";
import { useSmartReminder } from "@/hooks/useSmartReminder";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useDrinkIntentSync } from "@/hooks/useDrinkIntentSync";
import { useActiveSession } from "@/hooks/useDrinkingSession";
import { useTodayCheckin } from "@/hooks/useCheckin";
import { useCompanion } from "@/hooks/useCompanion";
import { HOME_ORBIT_ZONES, ZONES, type Zone } from "@/lib/zones";
import { headingShadow } from "@/styles";
import { queryClient } from "@/lib/queryClient";

// The destinations always orbit the companion. Visibility and discoverability
// are the whole point, so nothing hides them — the companion never toggles.
function HomeOrbitChip({ zone, style }: { zone: Zone; style: any }) {
  const router = useRouter();
  const multiline = zone.key === "community" || zone.key === "games";
  return (
    <View style={[{ position: "absolute", zIndex: 10 }, style]}>
      <OrbitChip
        label={multiline ? zone.label.replace(" ", "\n") : zone.label}
        accent={zone.accent}
        numberOfLines={multiline ? 2 : 1}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(zone.route as any);
        }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const { data: activeSession } = useActiveSession();
  const { data: todayCheckin } = useTodayCheckin();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useSmartReminder();
  useWidgetSync();
  useDrinkIntentSync();

  const companionTop = 104;
  // Community lives on Home already (the feed below), so it's dropped from the
  // orbit — leaving five destinations around the companion.
  const orbitZones = HOME_ORBIT_ZONES.filter(
    (z) => z.key !== "urge" && z.key !== "community",
  );
  const orbitPositions = [
    { left: 12, right: undefined, top: companionTop - 38 }, // reading
    { left: undefined, right: 12, top: companionTop - 38 }, // writing
    { left: 8, right: undefined, top: companionTop + 36 }, // games
    { left: undefined, right: 6, top: companionTop + 44 }, // support
    { left: 20, right: undefined, top: companionTop + 126 }, // me
  ];

  const urge = ZONES.urge;
  const refreshHome = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['community-feed'] }),
        queryClient.refetchQueries({ queryKey: ['community-moments'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeArea bottom={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshHome} tintColor="#B9A4EC" />}>
        <View className="flex-row items-center px-6 pt-3">
          <Pressable onPress={() => setDrawerOpen(true)} hitSlop={12} className="p-1 -ml-1 active:opacity-60" accessibilityLabel="Open menu">
            <Feather name="menu" size={24} color="#B2ACC0" />
          </Pressable>
        </View>

        <View className="items-center mt-3">
          <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 34 }}>Hey</Text>
          {!todayCheckin && (
            <Pressable onPress={() => router.push("/checkin")} className="mt-3 flex-row items-center gap-1.5 rounded-full px-4 py-2 border border-white/10 active:opacity-70" style={{ backgroundColor: "rgba(236,233,241,0.05)" }}>
              <Text className="text-text-secondary text-sm">How are you today?</Text>
              <Feather name="chevron-right" size={14} color="#817B91" />
            </Pressable>
          )}
          <Pressable onPress={() => router.push("/today")} className="mt-3 flex-row items-center gap-1.5 rounded-full px-4 py-2 border active:opacity-70" style={{ backgroundColor: "rgba(164,137,222,0.12)", borderColor: "rgba(164,137,222,0.4)" }}>
            <Feather name="sunrise" size={14} color="#B9A4EC" />
            <Text className="text-sm font-semibold" style={{ color: "#B9A4EC" }}>Today</Text>
          </Pressable>
        </View>

        <HomeStories />

        <View style={{ height: activeSession ? 438 : 394, position: "relative", marginTop: 12 }}>
          <View style={{ position: "absolute", left: 0, right: 0, top: companionTop, alignItems: "center", zIndex: 5 }} pointerEvents="box-none">
            <CompanionArt source={pose("bust")} width={232} height={276} cropHeight={216} />
          </View>

          {orbitZones.map((zone, index) => (
            <HomeOrbitChip key={zone.key} zone={zone} style={{ left: orbitPositions[index].left, right: orbitPositions[index].right, top: orbitPositions[index].top }} />
          ))}

          <View style={{ position: "absolute", left: 0, right: 0, top: companionTop + 211, zIndex: 10, alignItems: "center" }}>
            <OrbitChip label={urge.label} emergency onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.push(urge.route as any);
            }} />
          </View>

          {activeSession ? (
            <View style={{ position: "absolute", left: 0, right: 0, top: companionTop + 258, alignItems: "center" }}>
              <Pressable onPress={() => router.push("/session/track")} className="flex-row items-center gap-2 mb-3 active:opacity-80" style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "#060708", borderWidth: 1, borderColor: "rgba(236,233,241,0.14)" }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#C98282" }} />
                <Text className="text-text-secondary text-sm font-medium">
                  Session on{typeof (activeSession as any).drinks_count === "number" ? ` · ${(activeSession as any).drinks_count} ${(activeSession as any).drinks_count === 1 ? "drink" : "drinks"}` : ""}
                </Text>
                <Feather name="chevron-right" size={15} color="#817B91" />
              </Pressable>
            </View>
          ) : null}
        </View>

        <FoodCards />
        <HomeFeed />
      </ScrollView>
      <PauseModal />
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeArea>
  );
}
