import React, { useState, useEffect, useRef } from 'react';
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
import { SafeArea } from '@/components/ui/SafeArea';
import { Button } from '@/components/ui/Button';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { useStartSession } from '@/hooks/useDrinkingSession';
import { useLogUrgeOutcome, useUrgeStats, useTypicalUrgeMinutes } from '@/hooks/useVictories';
import { useAuthStore } from '@/store/authStore';
import { headingShadow, celebrationGlow } from '@/styles';
import type { UserPreferences } from '@/types';

const BREATH_MS = 4000;
const TOTAL_HALF_CYCLES = 6;

type Action = { id: string; label: string; subtitle: string; navigate?: string };

function buildActions(prefs: UserPreferences | null): Action[] {
  const list: Action[] = [];

  // No swaps here: browsing 0.0s to order online is general information, not
  // an in-the-moment intercept. The list lives on home and in Resources.

  // 1. Their people
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

  // 2. Games — the from=urge param makes finishing a game ask "did it pass?"
  list.push({
    id: 'game',
    label: 'Play a game',
    subtitle: 'Give your mind something else to do.',
    navigate: '/session/games?from=urge',
  });

  // 3. A human (or not)
  list.push({
    id: 'talk',
    label: 'Talk to someone (human or not)',
    subtitle: 'The AI is always awake. Your mentor might be too.',
    navigate: '/(tabs)/support',
  });

  // 4. The rest
  list.push({
    id: 'good',
    label: 'Watch something good',
    subtitle: "Ninety seconds of the internet at its best.",
    navigate: '/session/good-feed',
  });
  list.push({ id: 'water', label: 'Drink a glass of water', subtitle: 'Just that. Nothing else.' });
  list.push({ id: 'walk', label: 'Step outside for 5 minutes', subtitle: 'Movement breaks the moment.' });

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
  const { profile } = useAuthStore();
  const { mutate: startSession } = useStartSession();
  const { mutate: logUrge } = useLogUrgeOutcome();
  const { data: urgeStats } = useUrgeStats();
  const { data: typicalMinutes } = useTypicalUrgeMinutes();
  const urgeStartRef = useRef(Date.now());
  const prefs = (profile as any)?.preferences as UserPreferences | null;

  const [phase, setPhase] = useState<'breathing' | 'actions' | 'decision' | 'passed'>('breathing');
  const [halfCycle, setHalfCycle] = useState(0);
  const [actionIndex, setActionIndex] = useState(0);
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
  const currentAction = actions[actionIndex % actions.length];

  const nextAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActionIndex((i) => i + 1);
  };

  const doAction = () => {
    if (currentAction.navigate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // navigate (not push): tab routes like Support already exist below this
      // modal, so this dismisses the modal and focuses them; new routes push.
      router.navigate(currentAction.navigate as any);
      return;
    }
    // A physical, in-the-room action (water, walk, message someone) — they go
    // do it, then we ask how it went.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('decision');
  };

  const handleUrgePassed = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Capture the count before the query refetches, so the ack is stable.
    setSurvivedCount((urgeStats?.allTimePassed ?? 0) + 1);
    logUrge({
      outcome: 'passed',
      durationSeconds: (Date.now() - urgeStartRef.current) / 1000,
    });
    setPhase('passed');
  };

  const handleDrinkAnyway = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logUrge({
      outcome: 'drank',
      durationSeconds: (Date.now() - urgeStartRef.current) / 1000,
    });
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

        {/* Action phase — ONE suggestion at a time. Opening a bottle is one
            move; choosing from a scroll wall shouldn't be harder than that. */}
        {phase === 'actions' && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={{ flex: 1, justifyContent: 'center', minHeight: 520, paddingBottom: 8 }}
          >
            <View className="items-center">
              <CompanionArt
                source={require('../../assets/companions/image_14_elbows.png')}
                width={104}
                height={124}
                opacity={0.8}
              />
            </View>

            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3 mt-4">
              Just one thing
            </Text>

            {/* The single suggestion — re-animates each time it changes */}
            <Animated.View
              key={currentAction.id}
              entering={FadeInDown.duration(350)}
              className="bg-urge-surface rounded-3xl px-6 py-8 border border-white/12 mb-6"
              style={{
                shadowColor: '#120D17',
                shadowOpacity: 0.85,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 7 },
                borderTopColor: 'rgba(255,255,255,0.16)',
              }}
            >
              <Text
                className="text-text-primary text-3xl font-semibold leading-tight mb-2"
                style={headingShadow}
              >
                {currentAction.label}
              </Text>
              <Text className="text-text-secondary text-lg leading-relaxed">
                {currentAction.subtitle}
              </Text>
            </Animated.View>

            <Button
              title={currentAction.navigate ? "Take me there" : "Okay, I'll do this"}
              variant="primary"
              size="lg"
              fullWidth
              onPress={doAction}
            />

            <Pressable onPress={nextAction} hitSlop={10} className="items-center mt-5 py-2">
              <Text className="text-text-secondary text-base font-medium">
                Show me another →
              </Text>
            </Pressable>

            {typicalMinutes ? (
              <Text className="text-text-muted text-sm text-center leading-relaxed mt-6 px-4">
                These usually pass in ~{typicalMinutes} minute
                {typicalMinutes === 1 ? '' : 's'}. You've never regretted waiting one out.
              </Text>
            ) : null}

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPhase('decision');
              }}
              hitSlop={10}
              className="items-center mt-8 py-2"
            >
              <Text className="text-text-muted text-sm">It already passed →</Text>
            </Pressable>
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
                  It passed.
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
              style={celebrationGlow}
            >
              It passed.
            </Text>
            <CompanionArt
              source={require('../../assets/companions/image_19_small_smile.png')}
              width={74}
              height={88}
            />
            <Text className="text-text-secondary text-lg text-center leading-relaxed mb-12 mt-4 px-4">
              {survivedCount <= 1
                ? 'You got through your first one.'
                : `That's ${survivedCount} times you've got through it.`}
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
    </SafeArea>
  );
}
