import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, Text, View } from "react-native";
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
  zoneLayout?: OrbitLayout;
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export type CompanionMenuPoint = { x: number; y: number };
type OrbitPoint = CompanionMenuPoint;

type OrbitLayout = {
  anchor: OrbitPoint;
  points: OrbitPoint[];
  caption?: OrbitPoint;
};

const centerX = SCREEN_WIDTH / 2;

const ORBITS: Record<CompanionContext, OrbitLayout> = {
  home: {
    anchor: { x: 90, y: 206 },
    points: [
      { x: 98, y: -90 },
      { x: 114, y: -38 },
      { x: -78, y: -38 },
      { x: 18, y: 94 },
    ],
    caption: { x: 72, y: -92 },
  },
  journal: {
    anchor: { x: centerX, y: 350 },
    points: [
      { x: 0, y: -84 },
      { x: -104, y: 54 },
      { x: 88, y: 54 },
    ],
    caption: { x: 0, y: -92 },
  },
  support: {
    anchor: { x: centerX, y: 332 },
    points: [
      { x: -92, y: -56 },
      { x: 92, y: -56 },
      { x: -100, y: 52 },
      { x: 100, y: 52 },
    ],
    caption: { x: 0, y: -98 },
  },
  toolkit: {
    anchor: { x: centerX, y: 206 },
    points: [
      { x: -82, y: -52 },
      { x: 86, y: 52 },
    ],
    caption: { x: 0, y: -92 },
  },
  insights: {
    anchor: { x: centerX, y: 206 },
    points: [
      { x: -86, y: -54 },
      { x: 88, y: -54 },
      { x: 0, y: 76 },
    ],
    caption: { x: 0, y: -92 },
  },
  constellation: {
    anchor: { x: 78, y: Math.max(520, SCREEN_HEIGHT - 120) },
    points: [
      { x: 112, y: -60 },
      { x: 118, y: -12 },
    ],
    caption: { x: 120, y: -116 },
  },
  games: {
    anchor: { x: centerX, y: 206 },
    points: [
      { x: -86, y: -54 },
      { x: 88, y: -54 },
      { x: 0, y: 76 },
    ],
    caption: { x: 0, y: -92 },
  },
  profile: {
    anchor: { x: centerX, y: 206 },
    points: [
      { x: -96, y: -54 },
      { x: 92, y: -54 },
      { x: 0, y: 76 },
    ],
    caption: { x: 0, y: -92 },
  },
};

function chipsForContext(
  context: CompanionContext,
  onVoiceNote?: () => void,
  onToolkitSearch?: () => void,
): CompanionChip[] {
  const emergency = {
    label: "Urge support",
    route: "/session/urge",
    emergency: true,
  };
  const sets: Record<CompanionContext, CompanionChip[]> = {
    home: [
      { label: "Progress", route: "/(tabs)/insights" },
      { label: "Community", route: "/community" },
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
      { label: "Community", route: "/community" },
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
    constellation: [emergency, { label: "See calendar", route: "/timeline" }],
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
  zoneLayout,
}: CompanionMenuProps) {
  const router = useRouter();
  const chips = useMemo(
    () => chipsForContext(context, onVoiceNote, onToolkitSearch),
    [context, onVoiceNote, onToolkitSearch],
  );
  const chipAnims = useRef(chips.map(() => new Animated.Value(0))).current;
  const captionAnim = useRef(new Animated.Value(0)).current;
  const [renderMenu, setRenderMenu] = useState(visible);
  const lastMessage = useRef<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [constellationPrompt, setConstellationPrompt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (visible) {
      if (context === "constellation") {
        setConstellationPrompt(
          Math.random() > 0.5 ? "Two days." : "Ready for another star?",
        );
      }
      setRenderMenu(true);
      chipAnims.forEach((anim, index) => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 220,
          delay: index * 90,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    if (!renderMenu) return;
    Animated.stagger(
      35,
      [...chipAnims].reverse().map((anim) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ),
    ).start(() => {
      setRenderMenu(false);
      setConstellationPrompt(null);
    });
  }, [visible, chipAnims, renderMenu, context]);

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

  const orbit = zoneLayout ?? ORBITS[context];
  const activeConstellationPrompt =
    context === "constellation" && renderMenu ? constellationPrompt : null;

  if (!renderMenu && !caption) return null;

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      <Pressable
        className="absolute inset-0"
        onPress={() => {
          onClose();
          setCaption(null);
        }}
      />
      {(caption && !visible) || activeConstellationPrompt ? (
        <Animated.View
          className="absolute rounded-2xl border border-white/10 bg-black/55 px-3.5 py-2"
          style={{
            left: orbit.anchor.x + (orbit.caption?.x ?? 0),
            top: orbit.anchor.y + (orbit.caption?.y ?? 0),
            opacity: activeConstellationPrompt ? chipAnims[0] : captionAnim,
            transform: [
              {
                translateY: (activeConstellationPrompt
                  ? chipAnims[0]
                  : captionAnim
                ).interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, 0],
                }),
              },
              { translateX: -48 },
            ],
          }}
        >
          <Text className="text-text-secondary text-xs font-medium">
            {activeConstellationPrompt ?? caption}
          </Text>
        </Animated.View>
      ) : null}
      {renderMenu && (
        <View className="absolute inset-0" pointerEvents="box-none">
          {chips.map((chip, index) => {
            const point =
              orbit.points[index] ?? orbit.points[orbit.points.length - 1];
            const anim = chipAnims[index] ?? new Animated.Value(1);
            return (
              <Animated.View
                key={chip.label}
                className="absolute"
                style={{
                  left: orbit.anchor.x,
                  top: orbit.anchor.y,
                  opacity: anim,
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, point.x],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, point.y],
                      }),
                    },
                    { translateX: -44 },
                    { translateY: -18 },
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.72, 1],
                      }),
                    },
                  ],
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => runChip(chip)}
                  className={`rounded-full border px-3.5 py-2 ${chip.emergency ? "bg-accent border-accent" : "bg-black/60 border-stone-500/20"}`}
                >
                  <Text
                    className={`text-xs font-semibold ${chip.emergency ? "text-bg" : "text-stone-300"}`}
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
  );
}
