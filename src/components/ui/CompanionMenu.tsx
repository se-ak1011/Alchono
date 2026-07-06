import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

type CompanionContext =
  | "home"
  | "journal"
  | "support"
  | "toolkit"
  | "insights"
  | "constellation"
  | "games"
  | "profile";

type CompanionMenuProps = {
  visible: boolean;
  onClose: () => void;
  context: CompanionContext;
  quietSignal?: number;
  onVoiceNote?: () => void;
  onToolkitSearch?: () => void;
};

type CompanionChip = {
  label: string;
  route?: string;
  emergency?: boolean;
  action?: () => void;
};

const QUIET_MESSAGES: Record<CompanionContext, string[]> = {
  home: [
    "Still here.",
    "One step at a time.",
    "You've already done harder things.",
    "No rush.",
  ],
  journal: [
    "You don't have to write perfectly.",
    "Start anywhere.",
    "Small thoughts count too.",
    "It's only for you.",
  ],
  support: [
    "Stay with me.",
    "Just this moment.",
    "Let's slow things down.",
    "Breathe first.",
  ],
  toolkit: ["Just this moment.", "Let's slow things down.", "Breathe first."],
  insights: [
    "This all counts.",
    "Patterns become clearer.",
    "You're building something.",
    "Evidence matters.",
  ],
  constellation: [
    "Another star will come.",
    "Keep looking up.",
    "Every night changes the sky.",
    "One day becomes many.",
  ],
  games: [
    "Rest counts too.",
    "A small break helps.",
    "You're allowed to pause.",
  ],
  profile: [
    "You're more than your recovery.",
    "This is your space.",
    "You're allowed to change.",
  ],
};

const PLACEMENT: Record<
  CompanionContext,
  { top?: number; bottom?: number; left?: number; right?: number }
> = {
  home: { top: 96, left: 18 },
  journal: { top: 300, left: 28 },
  support: { top: 320, left: 70 },
  toolkit: { top: 118, left: 80 },
  insights: { top: 120, left: 72 },
  constellation: { top: 104, left: 72 },
  games: { top: 120, left: 72 },
  profile: { top: 120, left: 72 },
};

function chipsForContext(
  context: CompanionContext,
  onVoiceNote?: () => void,
  onToolkitSearch?: () => void,
): CompanionChip[] {
  const emergency = {
    label: "I need a drink",
    route: "/session/urge",
    emergency: true,
  };
  const sets: Record<CompanionContext, CompanionChip[]> = {
    home: [
      { label: "Progress", route: "/(tabs)/insights" },
      { label: "Looking forward", route: "/goals" },
      { label: "Games", route: "/session/games" },
      emergency,
    ],
    journal: [
      ...(onVoiceNote ? [{ label: "Voice note", action: onVoiceNote }] : []),
      { label: "Letters", route: "/letters/write" },
      emergency,
    ],
    support: [
      { label: "AI Coach", route: "/support/coach" },
      { label: "Recovery", route: "/support/recovery" },
      emergency,
    ],
    toolkit: [
      ...(onToolkitSearch
        ? [{ label: "Search", action: onToolkitSearch }]
        : []),
      emergency,
    ],
    insights: [
      { label: "Summary", route: "/summary" },
      { label: "Constellation", route: "/constellation" },
      emergency,
    ],
    constellation: [
      { label: "Summary", route: "/summary" },
      { label: "Insights", route: "/(tabs)/insights" },
      emergency,
    ],
    games: [
      { label: "Memory", route: "/session/memory-match" },
      { label: "Word Search", route: "/session/word-search" },
      emergency,
    ],
    profile: [
      { label: "Care Team", route: "/profile/care-team" },
      { label: "Things I enjoy", route: "/profile/hobbies" },
      emergency,
    ],
  };
  return sets[context].slice(0, 4);
}

export function CompanionMenu({
  visible,
  onClose,
  context,
  quietSignal = 0,
  onVoiceNote,
  onToolkitSearch,
}: CompanionMenuProps) {
  const router = useRouter();
  const chips = useMemo(
    () => chipsForContext(context, onVoiceNote, onToolkitSearch),
    [context, onVoiceNote, onToolkitSearch],
  );
  const chipAnims = useRef(chips.map(() => new Animated.Value(0))).current;
  const captionAnim = useRef(new Animated.Value(0)).current;
  const lastMessage = useRef<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    chipAnims.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 180,
        delay: index * 45,
        useNativeDriver: true,
      }).start();
    });
  }, [visible, chipAnims]);

  useEffect(() => {
    if (!quietSignal || visible) return;
    const messages = QUIET_MESSAGES[context];
    const available = messages.filter(
      (message) => message !== lastMessage.current,
    );
    const next =
      available[Math.floor(Math.random() * available.length)] ?? messages[0];
    lastMessage.current = next;
    setCaption(next);
    captionAnim.setValue(0);
    Animated.sequence([
      Animated.timing(captionAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(captionAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setCaption(null));
  }, [quietSignal, visible, context, captionAnim]);

  const runChip = async (chip: CompanionChip) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setCaption(null);
    if (chip.action) chip.action();
    if (chip.route) router.push(chip.route as any);
  };

  if (!visible && !caption) return null;

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      <Pressable
        className="absolute inset-0"
        onPress={() => {
          onClose();
          setCaption(null);
        }}
      />
      <View
        className="absolute"
        style={PLACEMENT[context]}
        pointerEvents="box-none"
      >
        {caption && !visible && (
          <Animated.View
            className="rounded-2xl border border-white/10 bg-black/55 px-3.5 py-2"
            style={{
              opacity: captionAnim,
              transform: [
                {
                  translateY: captionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            }}
          >
            <Text className="text-text-secondary text-xs font-medium">
              {caption}
            </Text>
          </Animated.View>
        )}
        {visible && (
          <View style={{ width: 250, height: 150 }} pointerEvents="box-none">
            {chips.map((chip, index) => {
              const positions = [
                { top: 0, left: 72 },
                { top: 42, left: 132 },
                { top: 82, left: 34 },
                { top: 104, left: 126 },
              ];
              const anim = chipAnims[index] ?? new Animated.Value(1);
              return (
                <Animated.View
                  key={chip.label}
                  className="absolute"
                  style={{
                    ...positions[index],
                    opacity: anim,
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => runChip(chip)}
                    className={`rounded-full border px-3.5 py-2 ${chip.emergency ? "bg-accent border-accent" : "bg-black/55 border-white/10"}`}
                  >
                    <Text
                      className={`text-xs font-semibold ${chip.emergency ? "text-bg" : "text-text-secondary"}`}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
