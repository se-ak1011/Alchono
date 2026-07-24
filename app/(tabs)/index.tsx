import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Animated as RNAnimated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { OrbitChip } from "@/components/ui/OrbitChip";
import { AppDrawer } from "@/components/ui/AppDrawer";
import { PauseModal } from "@/components/home/PauseModal";
import { FoodCards } from "@/components/home/FoodCards";
import { useSmartReminder } from "@/hooks/useSmartReminder";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useDrinkIntentSync } from "@/hooks/useDrinkIntentSync";
import { useActiveSession } from "@/hooks/useDrinkingSession";
import { useTodayCheckin } from "@/hooks/useCheckin";
import { useCompanion } from "@/hooks/useCompanion";
import { HOME_ORBIT_ZONES, ZONES, type Zone } from "@/lib/zones";
import { headingShadow } from "@/styles";

// Roughly how tall the three-card footer stands; the orbit reserves this
// space. (Approximate — includes the home-indicator inset on most phones.)
const NEWS_BAND_HEIGHT = 132;
const HINT_KEY = "alchono:orbit-hint-seen";

function HomeOrbitChip({
  zone,
  style,
  anim,
  open,
  fromX,
  fromY,
}: {
  zone: Zone;
  style: any;
  anim: RNAnimated.Value;
  open: boolean;
  fromX: number;
  fromY: number;
}) {
  const router = useRouter();
  const multiline = zone.key === "community" || zone.key === "games";
  return (
    <RNAnimated.View
      pointerEvents={open ? "auto" : "none"}
      style={[
        {
          position: "absolute",
          zIndex: 10,
          opacity: anim,
          transform: [
            {
              translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [fromX, 0] }),
            },
            {
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }),
            },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
          ],
        },
        style,
      ]}
    >
      <OrbitChip
        label={multiline ? zone.label.replace(" ", "\n") : zone.label}
        accent={zone.accent}
        numberOfLines={multiline ? 2 : 1}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(zone.route as any);
        }}
      />
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
  const orbitAnims = useRef(
    HOME_ORBIT_ZONES.slice(0, 6).map(() => new RNAnimated.Value(0)),
  ).current;

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
  const companionTop = Math.min(230, Math.max(190, AH * 0.4 - 80));
  const orbitPositions = useMemo(
    () => [
      { left: 12, right: undefined, top: companionTop - 38, fromX: 88, fromY: 88 },
      { left: undefined, right: 12, top: companionTop - 38, fromX: -88, fromY: 88 },
      { left: 8, right: undefined, top: companionTop + 36, fromX: 92, fromY: 14 },
      { left: undefined, right: 6, top: companionTop + 44, fromX: -92, fromY: 8 },
      { left: 20, right: undefined, top: companionTop + 126, fromX: 82, fromY: -64 },
      { left: undefined, right: 30, top: companionTop + 126, fromX: -82, fromY: -64 },
    ],
    [companionTop],
  );

  const setOrbit = (next: boolean) => {
    setOrbitOpen(next);
    const animations = orbitAnims.map((anim) =>
      RNAnimated.timing(anim, {
        toValue: next ? 1 : 0,
        duration: next ? 230 : 170,
        useNativeDriver: true,
      }),
    );
    (next
      ? RNAnimated.stagger(45, animations)
      : RNAnimated.stagger(25, [...animations].reverse())
    ).start();
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
            top: companionTop,
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
                top: 10,
                width: 190,
                height: 190,
                borderRadius: 95,
                backgroundColor: "rgba(164,137,222,0.22)",
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              }}
            />
          )}
          <CompanionArt
            source={pose("bust")}
            width={232}
            height={276}
            cropHeight={216}
            onPress={toggleOrbit}
          />
        </View>

        {/* The six calm destinations join the always-visible SOS chip. */}
        {HOME_ORBIT_ZONES.slice(0, 6).map((zone, index) => (
          <HomeOrbitChip
            key={zone.key}
            zone={zone}
            anim={orbitAnims[index]}
            open={orbitOpen}
            fromX={orbitPositions[index].fromX}
            fromY={orbitPositions[index].fromY}
            style={{
              left: orbitPositions[index].left,
              right: orbitPositions[index].right,
              top: orbitPositions[index].top,
            }}
          />
        ))}

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: companionTop + 211,
            zIndex: 10,
            alignItems: "center",
          }}
        >
          <OrbitChip
            label={urge.label}
            emergency
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.push(urge.route as any);
            }}
          />
        </View>

        {/* An active session remains findable without becoming part of the orbit. */}
        {activeSession ? (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: companionTop + 258,
              alignItems: "center",
            }}
          >
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
          </View>
        ) : null}

        {/* Food for the Soul / Giggles / Thought — a calm three-card footer */}
        <FoodCards top={companionTop + (activeSession ? 307 : 266)} />
      </View>

      <PauseModal />
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeArea>
  );
}
