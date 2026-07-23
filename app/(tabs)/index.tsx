import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Animated as RNAnimated,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { AppDrawer } from "@/components/ui/AppDrawer";
import { PauseModal } from "@/components/home/PauseModal";
import { GoodNewsBand } from "@/components/home/GoodNewsBand";
import { useSmartReminder } from "@/hooks/useSmartReminder";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useDrinkIntentSync } from "@/hooks/useDrinkIntentSync";
import { useActiveSession } from "@/hooks/useDrinkingSession";
import { useTodayCheckin } from "@/hooks/useCheckin";
import { useCompanion } from "@/hooks/useCompanion";
import { ORBIT_ZONES, ZONES, type Zone } from "@/lib/zones";
import { headingShadow } from "@/styles";

// Roughly how tall the Food-for-the-Soul footer stands; the orbit reserves
// this space. (Approximate — includes the home-indicator inset on most phones.)
const NEWS_BAND_HEIGHT = 182;
const HINT_KEY = "alchono:orbit-hint-seen";

function OrbitChip({
  zone,
  style,
  anim,
  open,
}: {
  zone: Zone;
  style: any;
  anim: RNAnimated.Value;
  open: boolean;
}) {
  const router = useRouter();
  return (
    <RNAnimated.View
      pointerEvents={open ? "auto" : "none"}
      style={[
        {
          position: "absolute",
          zIndex: 10,
          opacity: anim,
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
          ],
        },
        style,
      ]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(zone.route as any);
        }}
        className="active:opacity-70"
      >
        {/* A calm glassy pill: the zone's colour rides the little dot, the
            label reads itself. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: "rgba(236,233,241,0.055)",
            borderWidth: 1,
            borderColor: "rgba(236,233,241,0.10)",
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 9,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <View
            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: zone.accent }}
          />
          <Text
            style={{
              color: "#ECE9F1",
              fontFamily: "SkinnyCustard",
              fontSize: 23,
              lineHeight: 25,
            }}
          >
            {/* Break two-word labels onto two lines deterministically */}
            {zone.label.includes(" ") ? zone.label.replace(" ", "\n") : zone.label}
          </Text>
        </View>
      </Pressable>
    </RNAnimated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const { height } = useWindowDimensions();
  const { data: activeSession } = useActiveSession();
  const { data: todayCheckin } = useTodayCheckin();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The orbit is hidden until you tap the companion — Home stays calm.
  const [orbitOpen, setOrbitOpen] = useState(false);
  const orbitAnim = useRef(new RNAnimated.Value(0)).current;

  // A one-time breathing halo behind the companion, so first-timers know
  // there's something to tap. Dismissed the moment they open the orbit.
  const [showHint, setShowHint] = useState(false);
  const haloOpacity = useRef(new RNAnimated.Value(0)).current;
  const haloScale = useRef(new RNAnimated.Value(0.85)).current;

  useSmartReminder();
  useWidgetSync();
  useDrinkIntentSync();

  useEffect(() => {
    AsyncStorage.getItem(HINT_KEY).then((v) => {
      if (!v) setShowHint(true);
    });
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const pulse = RNAnimated.sequence([
      RNAnimated.parallel([
        RNAnimated.timing(haloOpacity, { toValue: 0.45, duration: 750, useNativeDriver: true }),
        RNAnimated.timing(haloScale, { toValue: 1.12, duration: 750, useNativeDriver: true }),
      ]),
      RNAnimated.parallel([
        RNAnimated.timing(haloOpacity, { toValue: 0, duration: 750, useNativeDriver: true }),
        RNAnimated.timing(haloScale, { toValue: 0.85, duration: 1, useNativeDriver: true }),
      ]),
    ]);
    RNAnimated.loop(pulse, { iterations: 3 }).start();
  }, [showHint, haloOpacity, haloScale]);

  // The good-news band is a fixed footer; the companion + orbit live in the
  // space above it. Anchors are fractions of that available height, so the
  // orbit keeps its shape from small phones to tall ones.
  const AH = height - NEWS_BAND_HEIGHT;
  const rows = useMemo(
    () => ({
      top: AH * 0.24,
      mid: AH * 0.44,
      low: AH * 0.62,
    }),
    [AH],
  );

  const setOrbit = (next: boolean) => {
    setOrbitOpen(next);
    RNAnimated.timing(orbitAnim, {
      toValue: next ? 1 : 0,
      duration: next ? 260 : 220,
      useNativeDriver: true,
    }).start();
  };

  const toggleOrbit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (showHint) {
      setShowHint(false);
      AsyncStorage.setItem(HINT_KEY, "1").catch(() => {});
    }
    setOrbit(!orbitOpen);
  };

  const urge = ZONES.urge;

  return (
    <SafeArea bottom={false}>
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
              width: 36,
              height: 36,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(164,137,222,0.16)",
              borderWidth: 1,
              borderColor: "rgba(164,137,222,0.5)",
            }}
          >
            <Text
              style={{
                fontFamily: "SkinnyCustard",
                fontSize: 24,
                lineHeight: 27,
                color: "#B9A4EC",
              }}
            >
              A
            </Text>
          </View>
        </View>

        {/* Greeting — the companion's world greets you directly; no narration */}
        <View className="items-center mt-3">
          <Text
            className="text-text-primary"
            style={{ ...headingShadow, fontSize: 34 }}
          >
            Hey
          </Text>
          {/* Daily check-in — the first (and only) thing asked, once a day */}
          {!todayCheckin && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/checkin");
              }}
              className="mt-3 flex-row items-center gap-1.5 rounded-full px-4 py-2 border border-white/10 active:opacity-70"
              style={{ backgroundColor: "rgba(236,233,241,0.05)" }}
            >
              <Text className="text-text-secondary text-sm">
                How are you today?
              </Text>
              <Feather name="chevron-right" size={14} color="#817B91" />
            </Pressable>
          )}
        </View>

        {/* Tap-anywhere-outside catcher — only while the orbit is open. Sits
            above the companion so tapping it (or the companion) collapses. */}
        {orbitOpen && (
          <Pressable
            onPress={() => setOrbit(false)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 8 }}
          />
        )}

        {/* Companion — the tap target. Stays perfectly still through expand /
            collapse; only the chips animate. */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: AH * 0.44 - 100,
            alignItems: "center",
            zIndex: 5,
          }}
          pointerEvents="box-none"
        >
          {/* Discovery halo — a soft breath behind the mate on first launch */}
          {showHint && (
            <RNAnimated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 12,
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: "rgba(164,137,222,0.22)",
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              }}
            />
          )}
          <CompanionArt
            source={pose("bust")}
            width={172}
            height={204}
            cropHeight={176}
            onPress={toggleOrbit}
          />
        </View>

        {/* Orbit chips — hidden until the companion is tapped */}
        <OrbitChip zone={ORBIT_ZONES[0]} anim={orbitAnim} open={orbitOpen} style={{ left: 14, top: rows.top }} />
        <OrbitChip zone={ORBIT_ZONES[1]} anim={orbitAnim} open={orbitOpen} style={{ right: 14, top: rows.top }} />
        <OrbitChip zone={ORBIT_ZONES[2]} anim={orbitAnim} open={orbitOpen} style={{ left: 10, top: rows.mid }} />
        <OrbitChip zone={ORBIT_ZONES[3]} anim={orbitAnim} open={orbitOpen} style={{ right: 10, top: rows.mid }} />
        <OrbitChip zone={ORBIT_ZONES[4]} anim={orbitAnim} open={orbitOpen} style={{ left: 14, top: rows.low }} />
        <OrbitChip zone={ORBIT_ZONES[5]} anim={orbitAnim} open={orbitOpen} style={{ right: 14, top: rows.low }} />

        {/* The one bold thing — always at the base, always findable.
            When a session is live, a slim chip sits just above it. */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: NEWS_BAND_HEIGHT + 18,
            alignItems: "center",
          }}
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
            <Text
              className="text-text-primary"
              style={{ fontFamily: "SkinnyCustard", fontSize: 23, lineHeight: 27 }}
            >
              {urge.label}
            </Text>
          </Pressable>
        </Animated.View>

        {/* A little good news — a calm footer, outside the orbit entirely */}
        <GoodNewsBand />
      </View>

      <PauseModal />
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeArea>
  );
}
