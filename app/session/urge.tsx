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
import { SafeArea } from '@/components/ui/SafeArea';
import { Button } from '@/components/ui/Button';
import { useStartSession } from '@/hooks/useDrinkingSession';
import { useAuthStore } from '@/store/authStore';
import type { UserPreferences } from '@/types';

const BREATH_MS = 4000;
const TOTAL_HALF_CYCLES = 6; // 3 full cycles

function buildPrompts(prefs: UserPreferences | null): string[] {
  const list: string[] = [];
  if (prefs?.familyMembers?.includes('children')) {
    const names = prefs.childrenNames?.trim();
    list.push(names ? `Think of ${names}.` : 'Think of your kids. They need you present.');
  }
  if (prefs?.familyMembers?.includes('partner')) {
    const name = prefs.partnerName?.trim();
    list.push(name ? `Think of ${name}.` : "Think of your partner. You're in this together.");
  }
  if (prefs?.familyMembers?.includes('parents')) {
    list.push('Your parents want to see you well.');
  }
  if (prefs?.hasPets) {
    const name = prefs.petName?.trim() || 'your pet';
    list.push(`Go check on ${name}.`);
  }
  list.push('Drink a glass of water. Just that.');
  list.push('The urge will pass. They always do.');
  return list;
}

export default function UrgeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { mutate: startSession } = useStartSession();
  const prefs = (profile as any)?.preferences as UserPreferences | null;

  const [phase, setPhase] = useState<'breathing' | 'prompts' | 'decision'>('breathing');
  const [halfCycle, setHalfCycle] = useState(0);

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
      setPhase('prompts');
      return;
    }
    circleScale.value = withTiming(isIn ? 1.4 : 0.6, { duration: BREATH_MS });
    circleOpacity.value = withTiming(isIn ? 0.75 : 0.35, { duration: BREATH_MS });
    const t = setTimeout(() => setHalfCycle((h) => h + 1), BREATH_MS);
    return () => clearTimeout(t);
  }, [phase, halfCycle]);

  const prompts = buildPrompts(prefs);
  const breathsLeft = Math.ceil((TOTAL_HALF_CYCLES - halfCycle) / 2);

  const handleUrgePassed = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleDrinkAnyway = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession();
    router.back();
  };

  return (
    <SafeArea bottom={false}>
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-text-muted text-sm">Close</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {phase === 'breathing' && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 520 }}
          >
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-12">
              Just breathe
            </Text>

            {/* Animated circle */}
            <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 48 }}>
              <Animated.View
                style={[
                  {
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    backgroundColor: '#9CA3AF',
                    position: 'absolute',
                  },
                  circleStyle,
                ]}
              />
            </View>

            <Text className="text-text-primary text-2xl font-semibold mb-2">
              {isIn ? 'Breathe in…' : 'Breathe out…'}
            </Text>
            <Text className="text-text-muted text-sm mb-10">
              {breathsLeft} {breathsLeft === 1 ? 'breath' : 'breaths'} left
            </Text>

            <Pressable onPress={() => setPhase('prompts')} hitSlop={12}>
              <Text className="text-text-muted text-sm">Skip</Text>
            </Pressable>
          </Animated.View>
        )}

        {phase === 'prompts' && (
          <Animated.View entering={FadeIn.duration(400)} style={{ paddingTop: 16 }}>
            <Text className="text-text-primary text-2xl font-bold tracking-tight mb-1">
              Before you decide.
            </Text>
            <Text className="text-text-secondary text-sm mb-6">
              Read these.
            </Text>

            <View style={{ gap: 12, marginBottom: 32 }}>
              {prompts.map((prompt, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.duration(400).delay(i * 80)}
                  className="bg-surface rounded-2xl px-4 py-4 border border-white/5"
                >
                  <Text className="text-text-primary text-sm leading-relaxed">
                    {prompt}
                  </Text>
                </Animated.View>
              ))}
            </View>

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
          </Animated.View>
        )}

        {phase === 'decision' && (
          <Animated.View entering={FadeIn.duration(400)} style={{ paddingTop: 16 }}>
            <Text className="text-text-primary text-2xl font-bold tracking-tight mb-1">
              Did it pass?
            </Text>
            <Text className="text-text-secondary text-sm mb-8">
              Honest answer.
            </Text>

            <View style={{ gap: 12 }}>
              <Pressable
                onPress={handleUrgePassed}
                className="bg-surface rounded-2xl border border-white/20 active:border-white/40"
                style={{ paddingHorizontal: 20, paddingVertical: 20 }}
              >
                <Text className="text-text-primary text-base font-semibold mb-1">
                  The urge passed.
                </Text>
                <Text className="text-text-muted text-sm">
                  Good. Keep going.
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDrinkAnyway}
                className="bg-surface rounded-2xl border border-white/8 active:bg-surface-2"
                style={{ paddingHorizontal: 20, paddingVertical: 20 }}
              >
                <Text className="text-text-primary text-base font-semibold mb-1">
                  I'm going to drink anyway.
                </Text>
                <Text className="text-text-muted text-sm">
                  We'll be here. Session logged.
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeArea>
  );
}
