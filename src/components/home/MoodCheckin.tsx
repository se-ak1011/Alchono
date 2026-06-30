import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOOD_OPTIONS, type MoodOption } from '@/types';
import { useTodayCheckin, useSubmitCheckin } from '@/hooks/useCheckin';

export function MoodCheckin() {
  const { data: todayCheckin, isLoading } = useTodayCheckin();
  const { mutate: submitCheckin, isPending } = useSubmitCheckin();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (isLoading) return null;

  if (todayCheckin) {
    const moodValues = todayCheckin.mood.split(',').map((m) => m.trim());
    const logged = moodValues
      .map((v) => MOOD_OPTIONS.find((o) => o.value === v))
      .filter(Boolean) as MoodOption[];

    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <Card className="mx-6 mt-2">
          <Text className="text-text-secondary text-sm font-medium mb-3">
            Today's check-in
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {logged.length > 0
              ? logged.map((option) => (
                  <View
                    key={option.value}
                    className="flex-row items-center gap-1.5 bg-surface-2 rounded-full px-3 py-1.5"
                  >
                    <Text className="text-base">{option.emoji}</Text>
                    <Text className="text-text-primary text-sm font-medium">
                      {option.label}
                    </Text>
                  </View>
                ))
              : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">{todayCheckin.mood_emoji}</Text>
                  <Text className="text-text-primary text-base font-semibold capitalize">
                    {todayCheckin.mood}
                  </Text>
                </View>
              )}
          </View>
          <Text className="text-text-muted text-xs mt-2">Logged today</Text>
        </Card>
      </Animated.View>
    );
  }

  const toggle = (option: MoodOption) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option.value)) {
        next.delete(option.value);
      } else {
        next.add(option.value);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    const selectedOptions = MOOD_OPTIONS.filter((o) => selected.has(o.value));
    const mood = selectedOptions.map((o) => o.value).join(',');
    const emoji = selectedOptions.map((o) => o.emoji).join('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    submitCheckin({ mood, emoji });
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-2">
      <Card elevated>
        <Text className="text-text-primary text-base font-semibold mb-1">
          How are you feeling?
        </Text>
        <Text className="text-text-secondary text-sm mb-4">
          Select all that apply.
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {MOOD_OPTIONS.map((option) => (
            <MoodChip
              key={option.value}
              option={option}
              selected={selected.has(option.value)}
              onPress={() => toggle(option)}
            />
          ))}
        </View>
        {selected.size > 0 && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Button
              title="Log how I'm feeling"
              variant="primary"
              size="sm"
              fullWidth
              loading={isPending}
              onPress={handleSubmit}
            />
          </Animated.View>
        )}
      </Card>
    </Animated.View>
  );
}

function MoodChip({
  option,
  selected,
  onPress,
}: {
  option: MoodOption;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 12, stiffness: 350 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 350 });
        }}
        onPress={onPress}
        className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
          selected ? 'bg-accent/20 border-accent/50' : 'bg-surface-2 border-white/8'
        }`}
      >
        <Text className="text-xl">{option.emoji}</Text>
        <Text
          className={`text-sm font-medium ${
            selected ? 'text-accent' : 'text-text-secondary'
          }`}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
