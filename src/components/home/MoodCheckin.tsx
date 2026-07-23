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
import { useTodayCheckin, useSubmitCheckin, useUpdateCheckin } from '@/hooks/useCheckin';

export function MoodCheckin({ onDone }: { onDone?: () => void } = {}) {
  const { data: todayCheckin, isLoading } = useTodayCheckin();
  const { mutate: submitCheckin, isPending: isSubmitting } = useSubmitCheckin();
  const { mutate: updateCheckin, isPending: isUpdating } = useUpdateCheckin();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);

  if (isLoading) return null;

  if (todayCheckin && !editing) {
    const moodValues = todayCheckin.mood.split(',').map((m) => m.trim());
    const logged = moodValues
      .map((v) => MOOD_OPTIONS.find((o) => o.value === v))
      .filter(Boolean) as MoodOption[];

    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <Card className="mx-6 mt-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase">
              Check-in
            </Text>
            <Pressable
              onPress={() => {
                const current = new Set(moodValues.filter(Boolean));
                setSelected(current);
                setEditing(true);
              }}
              hitSlop={8}
            >
              <Text className="text-text-muted text-sm">Update</Text>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {logged.length > 0
              ? logged.map((option) => (
                  <View
                    key={option.value}
                    className="bg-surface-2 rounded-xl px-4 py-2 border border-white/8"
                  >
                    <Text className="text-text-primary text-base font-medium capitalize">
                      {option.label}
                    </Text>
                  </View>
                ))
              : (
                <Text className="text-text-primary text-base font-medium capitalize">
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

    if (editing && todayCheckin) {
      updateCheckin(
        { id: todayCheckin.id, mood, emoji },
        { onSuccess: () => { setEditing(false); onDone?.(); } },
      );
    } else {
      submitCheckin({ mood, emoji }, { onSuccess: () => onDone?.() });
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3">
      <Card elevated>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase">
            How are you?
          </Text>
          {editing && (
            <Pressable
              onPress={() => setEditing(false)}
              hitSlop={8}
            >
              <Text className="text-text-muted text-sm">Cancel</Text>
            </Pressable>
          )}
        </View>
        <View className="flex-row flex-wrap gap-2 mb-4">
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
              title={editing ? 'Save' : 'Log check-in'}
              variant="primary"
              size="md"
              fullWidth
              loading={isSubmitting || isUpdating}
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
        className={`px-4 py-2.5 rounded-xl border ${
          selected
            ? 'bg-surface border-white/30'
            : 'bg-surface-2 border-white/5'
        }`}
      >
        <Text
          className={`text-base font-medium ${
            selected ? 'text-text-primary' : 'text-text-muted'
          }`}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
