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
import { MOOD_OPTIONS, type MoodOption } from '@/types';
import { useTodayCheckin, useSubmitCheckin } from '@/hooks/useCheckin';

export function MoodCheckin() {
  const { data: todayCheckin, isLoading } = useTodayCheckin();
  const { mutate: submitCheckin, isPending } = useSubmitCheckin();
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading) return null;

  if (todayCheckin) {
    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <Card className="mx-6 mt-2">
          <Text className="text-text-secondary text-sm font-medium mb-2">
            Today's check-in
          </Text>
          <View className="flex-row items-center gap-3">
            <Text className="text-3xl">{todayCheckin.mood_emoji}</Text>
            <View>
              <Text className="text-text-primary text-base font-semibold capitalize">
                {todayCheckin.mood}
              </Text>
              <Text className="text-text-muted text-xs mt-0.5">
                Logged today
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  }

  const handleSelect = (option: MoodOption) => {
    setSelected(option.value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitCheckin({ mood: option.value, emoji: option.emoji });
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-2">
      <Card elevated>
        <Text className="text-text-primary text-base font-semibold mb-1">
          How are you feeling?
        </Text>
        <Text className="text-text-secondary text-sm mb-4">
          One tap. No pressure.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {MOOD_OPTIONS.map((option) => (
            <MoodButton
              key={option.value}
              option={option}
              selected={selected === option.value}
              loading={isPending && selected === option.value}
              onPress={() => handleSelect(option)}
            />
          ))}
        </View>
      </Card>
    </Animated.View>
  );
}

function MoodButton({
  option,
  selected,
  loading,
  onPress,
}: {
  option: MoodOption;
  selected: boolean;
  loading: boolean;
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
        className={`items-center px-3 py-2 rounded-xl border ${
          selected
            ? 'bg-accent/20 border-accent/50'
            : 'bg-surface-2 border-white/8'
        }`}
      >
        <Text className="text-2xl mb-0.5">{option.emoji}</Text>
        <Text
          className={`text-xs font-medium ${
            selected ? 'text-accent' : 'text-text-secondary'
          }`}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
