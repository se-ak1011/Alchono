import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeArea } from '@/components/ui/SafeArea';
import { Button } from '@/components/ui/Button';
import { useStartSession } from '@/hooks/useDrinkingSession';
import { useLogUrgeOutcome, useUrgeStats } from '@/hooks/useVictories';
import { useAuthStore } from '@/store/authStore';
import { headingShadow } from '@/styles';
import type { UserPreferences } from '@/types';

const BREATH_MS = 4000;
const TOTAL_HALF_CYCLES = 6;

type Action = { id: string; label: string; subtitle: string; navigate?: string };

function buildActions(prefs: UserPreferences | null): Action[] {
  const list: Action[] = [];

  if (prefs?.familyMembers?.includes('partner')) {
    const name = prefs.partnerName?.trim();
    list.push({
      id: 'partner',
      label: name ? `Message ${name}` : 'Message your partner',
      subtitle: 'They want to hear from you.',
    });
  }

  if (prefs?.familyMembers?.includes('children')) {
    const names = prefs.childrenNames?.trim();
    const count = prefs.childrenCount ?? 1;
    const fallback = count === 1 ? 'your child' : 'your kids';
    list.push({
      id: 'kids',
      label: `Check in with ${names || fallback}`,
      subtitle: 'Be present for a moment.',
    });
  }

  if (prefs?.hasPets) {
    const petCount = prefs.petCount ?? 1;
    const name = prefs.petName?.trim() || (petCount === 1 ? 'your pet' : 'your pets');
    list.push({
      id: 'pet',
      label: `Take ${name} outside`,
      subtitle: 'Fresh air. Movement. Shift the state.',
    });
  }

  list.push({ id: 'water', label: 'Drink a glass of water', subtitle: 'Just that. Nothing else.' });
  list.push({ id: 'walk', label: 'Step outside for 5 minutes', subtitle: 'Movement breaks the moment.' });
  list.push({
    id: 'talk',
    label: 'Talk to someone (human or not)',
    subtitle: 'The AI is always awake. Your mentor might be too.',
    navigate: '/(tabs)/support',
  });
  list.push({
    id: 'good',
    label: 'Watch something good',
    subtitle: "Ninety seconds of the internet at its best.",
    navigate: '/session/good-feed',
  });

  if (prefs?.interestedInAlternatives) {
    list.push({
      id: 'swap',
      label: 'Swap it, don’t fight it',
      subtitle: 'Same ritual, zero alcohol. See what works.',
      navigate: '/swaps',
    });
  }
  list.push({
    id: 'game',
    label: 'Play a game',
    subtitle: 'Give your mind something else to do.',
    navigate: '/session/games',
  });

  return list;
}

function buildReasonNames(prefs: UserPreferences | null): string | null {
  if (!prefs) return null;
  const parts: string[] = [];
  if (prefs.familyMembers?.includes('partner') && prefs.partnerName?.trim()) {
    parts.push(prefs.partnerName.trim());
  }
  if (prefs.familyMembers?.includes('children') && prefs.childrenNames?.trim()) {
    parts.push(prefs.childrenNames.trim());
  }
  return parts.length > 0 ? parts.join(' & ') : null;
}

export default function UrgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { mutate: startSession } = useStartSession();
  const { mutate: logUrge } = useLogUrgeOutcome();
  const { data: urgeStats } = useUrgeStats();
  const prefs = (profile as any)?.preferences as UserPreferences | null;

  const [phase, setPhase] = useState<'breathing' | 'actions' | 'decision' | 'passed'>('breathing');
  const [halfCycle, setHalfCycle] = useState(0);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [survivedCount, setSurvivedCount] = useState(0);

  const circleScale = useSharedValue(0.6);
  const circleOpacity = useSharedValue(0.35);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleOpacity.value,
  }));

  const isIn = halfCycle % 2 === 0;

  useEffect(() => {
    if (phase !== 'breathing') return;
    if (halfCycle >= TOTAL_HALF_CYCLES) {
      setPhase('actions');
      return;
    }
    // A soft pulse on each transition so the rhythm works with eyes closed.
    Haptics.impactAsync(
      isIn ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
    circleScale.value = withTiming(isIn ? 1.4 : 0.6, { duration: BREATH_MS });
    circleOpacity.value = withTiming(isIn ? 0.75 : 0.35, { duration: BREATH_MS });
    const t = setTimeout(() => setHalfCycle((h) => h + 1), BREATH_MS);
    return () => clearTimeout(t);
  }, [phase, halfCycle]);

  const actions = buildActions(prefs);
  const reasonNames = buildReasonNames(prefs);
  const breathsLeft = Math.ceil((TOTAL_HALF_CYCLES - halfCycle) / 2);

  const toggleTick = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleUrgePassed = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Capture the count before the query refetches, so the ack is stable.
    setSurvivedCount((urgeStats?.allTimePassed ?? 0) + 1);
    logUrge('passed');
    setPhase('passed');
  };

  const handleDrinkAnyway = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logUrge('drank');
    startSession();
    router.back();
  };

  return (
    <SafeArea bottom={false}>
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-text-muted text-base">Close</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Breathing phase */}
        {phase === 'breathing' && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 520 }}
          >
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-12">
              Just breathe
            </Text>

            <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginBottom: 48 }}>
              <Animated.View
                style={[
                  {
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    backgroundColor: '#9CA3AF',
                    position: 'absolute',
                  },
                  circleStyle,
                ]}
              />
            </View>

            <Text className="text-text-primary text-3xl font-semibold mb-2" style={headingShadow}>
              {isIn ? 'Breathe in…' : 'Breathe out…'}
            </Text>
            <Text className="text-text-muted text-base mb-10">
              {breathsLeft} {breathsLeft === 1 ? 'breath' : 'breaths'} left
            </Text>

            <Pressable onPress={() => setPhase('actions')} hitSlop={12}>
              <Text className="text-text-muted text-base">Skip</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Action cards phase */}
        {phase === 'actions' && (
          <Animated.View entering={FadeIn.duration(400)} style={{ paddingTop: 16 }}>
            <Text
              className="text-text-primary text-3xl font-semibold tracking-tight mb-1"
              style={headingShadow}
            >
              Do one of these.
            </Text>
            <Text className="text-text-secondary text-base mb-6">
              Tick it off when done.
            </Text>

            <View style={{ gap: 12, marginBottom: 32 }}>
              {actions.map((action, i) => {
                const done = ticked.has(action.id);
                const navigates = !!action.navigate;
                return (
                  <Animated.View
                    key={action.id}
                    entering={FadeInDown.duration(300).delay(i * 50)}
                  >
                    <Pressable
                      onPress={() => {
                        if (action.navigate) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          // navigate (not push): tab routes like Support already
                          // exist below this modal, so this dismisses the modal
                          // and focuses them; new routes (games) still push.
                          router.navigate(action.navigate as any);
                          return;
                        }
                        toggleTick(action.id);
                      }}
                      className={`flex-row items-center gap-4 bg-urge-surface rounded-2xl px-5 py-5 border ${
                        done ? 'border-white/20' : 'border-white/8'
                      }`}
                      style={{
                        opacity: done ? 0.7 : 1,
                        shadowColor: '#120D17',
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 5 },
                      }}
                    >
                      <Text
                        className={`text-base w-3 ${done ? 'text-text-secondary' : 'text-text-muted'}`}
                      >
                        {done ? '◆' : '◇'}
                      </Text>
                      <View className="flex-1">
                        <Text
                          className={`text-base font-medium leading-snug ${
                            done ? 'text-text-secondary' : 'text-text-primary'
                          }`}
                        >
                          {action.label}
                        </Text>
                        <Text className="text-text-muted text-sm mt-0.5">
                          {action.subtitle}
                        </Text>
                      </View>
                      {navigates && (
                        <Text className="text-text-muted text-sm">→</Text>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Decision phase */}
        {phase === 'decision' && (
          <Animated.View entering={FadeIn.duration(400)} style={{ paddingTop: 16 }}>
            <Text
              className="text-text-primary text-3xl font-semibold tracking-tight mb-1"
              style={headingShadow}
            >
              Did it pass?
            </Text>
            <Text className="text-text-secondary text-base mb-6">
              Honest answer.
            </Text>

            {reasonNames && (
              <View className="mb-8">
                <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-1">
                  Remember
                </Text>
                <Text className="text-text-primary text-2xl font-semibold">
                  {reasonNames}.
                </Text>
              </View>
            )}

            <View style={{ gap: 12 }}>
              <Pressable
                onPress={handleUrgePassed}
                className="bg-urge-surface rounded-2xl border border-white/20 active:border-white/40"
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 22,
                  shadowColor: '#120D17',
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 5 },
                }}
              >
                <Text className="text-text-primary text-lg font-semibold mb-1">
                  The urge passed.
                </Text>
                <Text className="text-text-muted text-base">
                  Good. Keep going.
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDrinkAnyway}
                className="bg-urge-surface rounded-2xl border border-white/8 active:bg-surface-2"
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 22,
                  shadowColor: '#120D17',
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 5 },
                }}
              >
                <Text className="text-text-primary text-lg font-semibold mb-1">
                  I'm going to drink anyway.
                </Text>
                <Text className="text-text-muted text-base">
                  We'll be here. Session logged.
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Passed phase — the win gets acknowledged, not just dismissed */}
        {phase === 'passed' && (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 480 }}
          >
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-4">
              Logged
            </Text>
            <Text
              className="text-text-primary text-4xl font-semibold tracking-tight mb-3"
              style={headingShadow}
            >
              It passed.
            </Text>
            <Text className="text-text-secondary text-lg text-center leading-relaxed mb-12 px-4">
              {survivedCount <= 1
                ? 'Your first urge, beaten.'
                : `That's ${survivedCount} urges beaten.`}
              {'\n'}Proof this works.
            </Text>
            <Button
              title="Done"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Pinned footer — Continue must never sit below the fold */}
      {phase === 'actions' && (
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <Button
            title="Continue"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPhase('decision');
            }}
          />
        </View>
      )}
    </SafeArea>
  );
}
