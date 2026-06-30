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
          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
            Check-in
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {logged.length > 0
              ? logged.map((option) => (
                  <View
                    key={option.value}
                    className="bg-surface-2 rounded-lg px-3 py-1.5 border border-white/8"
                  >
                    <Text className="text-text-primary text-sm font-medium capitalize">
                      {option.label}
                    </Text>
                  </View>
                ))
              : (
                <Text className="text-text-primary text-sm font-medium capitalize">
                  {todayCheckin.mood}
                </Text>
              )}
          </View>
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
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-4">
          How are you feeling?
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
              title="Log check-in"
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
          scale.value = withSpring(0.93, { damping: 12, stiffness: 350 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 350 });
        }}
        onPress={onPress}
        className={`px-3 py-2 rounded-lg border ${
          selected
            ? 'bg-surface border-white/30'
            : 'bg-surface-2 border-white/5'
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            selected ? 'text-text-primary' : 'text-text-muted'
          }`}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
