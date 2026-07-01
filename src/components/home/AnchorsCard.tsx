import React, { useState, useRef } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { useGoals } from '@/hooks/useGoals';
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
  const profile = useAuthStore((s) => s.profile);
  const prefs = profile?.preferences as UserPreferences | null;
  const { goals, addGoal, removeGoal } = useGoals();
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);

  const names = buildNames(prefs);

  const handleAdd = () => {
    if (!input.trim()) { setAdding(false); return; }
    addGoal(input.trim());
    setInput('');
    setAdding(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3">
      <Card className="border border-white/5">
        {/* People */}
        {names && (
          <View className={goals.length > 0 || adding ? 'mb-4' : ''}>
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-2">
              Reasons
            </Text>
            <Text className="text-text-primary text-lg font-semibold mb-1.5">
              {names}.
            </Text>
            <Text className="text-text-secondary text-sm leading-relaxed">
              {getDailyAnchor()}
            </Text>
          </View>
        )}

        {/* Divider */}
        {names && (goals.length > 0 || adding) && (
          <View className="h-px bg-white/5 mb-4" />
        )}

        {/* Goals */}
        {goals.length > 0 && (
          <View className={adding ? 'mb-3' : 'mb-1'}>
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
              Looking forward to
            </Text>
            {goals.map((goal, i) => (
              <Animated.View
                key={goal.id}
                entering={FadeInDown.duration(300).delay(i * 40)}
                className="flex-row items-center gap-3 mb-2.5"
              >
                <Text className="text-text-muted text-xs w-3">—</Text>
                <Text className="text-text-secondary text-sm flex-1 leading-relaxed">
                  {goal.text}
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    removeGoal(goal.id);
                  }}
                  hitSlop={12}
                >
                  <Text className="text-text-muted text-base leading-none">×</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Add goal */}
        {adding ? (
          <TextInput
            ref={inputRef}
            autoFocus
            placeholder="Something to look forward to…"
            placeholderTextColor="#4B5563"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            onBlur={() => { if (!input.trim()) setAdding(false); }}
            returnKeyType="done"
            style={{
              color: '#F0F2F4',
              fontSize: 14,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            }}
          />
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            hitSlop={8}
            className="mt-1"
          >
            <Text className="text-text-muted text-sm">
              {goals.length === 0 && !names
                ? '+ What are you building towards?'
                : '+ Add something good'}
            </Text>
          </Pressable>
        )}
      </Card>
    </Animated.View>
  );
}
