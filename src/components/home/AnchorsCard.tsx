import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { useGoals, formatTargetDate, daysUntil } from '@/hooks/useGoals';
import type { UserPreferences } from '@/types';

const DAILY_ANCHORS = [
  "They need you present, not perfect.",
  "The good things are real. Still real.",
  "You built something worth protecting.",
  "Still here. Still building.",
  "One day at a time. That's enough.",
  "What you're building matters.",
  "The hard days don't cancel the good ones.",
  "Keep going. For them. For you.",
];

function getDailyAnchor(): string {
  const day = Math.floor(Date.now() / 86400000);
  return DAILY_ANCHORS[day % DAILY_ANCHORS.length];
}

function buildNames(prefs: UserPreferences | null): string | null {
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

export function AnchorsCard() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const prefs = profile?.preferences as UserPreferences | null;
  const { data: allGoals = [] } = useGoals();

  const names = buildNames(prefs);
  const activeGoals = allGoals.filter((g) => !g.completed_at);
  const preview = activeGoals.slice(0, 3);
  const overflow = activeGoals.length - preview.length;

  if (!names && activeGoals.length === 0) {
    return (
      <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-4">
        <Pressable onPress={() => router.push('/goals')} className="py-2">
          <Text className="text-text-muted text-base">+ What are you building towards?</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-4">
      <Card className="border border-white/5">
        {/* People */}
        {names && (
          <View className={activeGoals.length > 0 ? 'mb-5' : ''}>
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-2">
              Reasons
            </Text>
            <Text className="text-text-primary text-2xl font-semibold mb-2">
              {names}.
            </Text>
            <Text className="text-text-secondary text-base leading-relaxed">
              {getDailyAnchor()}
            </Text>
          </View>
        )}

        {/* Divider */}
        {names && activeGoals.length > 0 && (
          <View className="h-px bg-white/5 mb-5" />
        )}

        {/* Goals preview */}
        {preview.length > 0 && (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase">
                Looking forward to
              </Text>
              <Pressable onPress={() => router.push('/goals')} hitSlop={8}>
                <Text className="text-text-muted text-sm">Manage →</Text>
              </Pressable>
            </View>
            {preview.map((goal) => {
              const days = goal.target_date ? daysUntil(goal.target_date) : null;
              return (
                <View key={goal.id} className="flex-row items-center gap-3 mb-3">
                  <Text className="text-text-muted text-sm w-3">—</Text>
                  <Text className="text-text-secondary text-base flex-1 leading-relaxed">
                    {goal.text}
                  </Text>
                  {days !== null && (
                    <Text className={`text-sm font-medium ${days < 14 ? 'text-text-secondary' : 'text-text-muted'}`}>
                      {days <= 0 ? 'now' : `${days}d`}
                    </Text>
                  )}
                </View>
              );
            })}
            {overflow > 0 && (
              <Pressable onPress={() => router.push('/goals')} className="mt-1">
                <Text className="text-text-muted text-sm">+{overflow} more →</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Empty goals state */}
        {activeGoals.length === 0 && (
          <Pressable onPress={() => router.push('/goals')} hitSlop={8}>
            <Text className="text-text-muted text-base">+ Add something to look forward to</Text>
          </Pressable>
        )}
      </Card>
    </Animated.View>
  );
}
