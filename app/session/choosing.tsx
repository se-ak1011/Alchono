import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { useSaveChoices } from '@/hooks/useChoices';
import { CHOICE_OPTIONS } from '@/types';
import { headingShadow } from '@/styles';

export default function ChoosingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mutate: saveChoices, isPending } = useSaveChoices();
  const [selected, setSelected] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [other, setOther] = useState('');

  const toggle = (choice: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(choice) ? prev.filter((c) => c !== choice) : [...prev, choice],
    );
  };

  const handleSave = () => {
    const all = [...selected];
    if (showOther && other.trim()) all.push(other.trim());
    if (all.length === 0) {
      router.back();
      return;
    }
    saveChoices(all, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
      onError: (e) =>
        Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
    });
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-row items-center px-6 mb-6">
        <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
          <Text className="text-text-secondary text-xl">✕</Text>
        </Pressable>
        <Text className="text-text-primary text-xl font-semibold">This evening</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text
            className="text-text-primary text-3xl font-semibold mb-2 leading-tight"
            style={headingShadow}
          >
            Today I chose…
          </Text>
          <Text className="text-text-secondary text-base mb-6 leading-relaxed">
            Every choice counts. Pick whatever's true — you can pick more than one.
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {CHOICE_OPTIONS.map((choice) => (
              <Pressable
                key={choice}
                onPress={() => toggle(choice)}
                className={`px-5 py-3 rounded-xl border ${
                  selected.includes(choice)
                    ? 'bg-accent/20 border-accent/50'
                    : 'bg-surface border-white/8'
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    selected.includes(choice) ? 'text-accent' : 'text-text-secondary'
                  }`}
                >
                  {choice}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowOther((v) => !v);
              }}
              className={`px-5 py-3 rounded-xl border ${
                showOther ? 'bg-accent/20 border-accent/50' : 'bg-surface border-white/8'
              }`}
            >
              <Text
                className={`text-base font-medium ${
                  showOther ? 'text-accent' : 'text-text-secondary'
                }`}
              >
                something else…
              </Text>
            </Pressable>
          </View>

          {showOther && (
            <Animated.View entering={FadeInDown.duration(300)} className="mt-4">
              <TextInput
                value={other}
                onChangeText={setOther}
                placeholder="Today I chose to…"
                placeholderTextColor="#817B91"
                autoFocus
                className="bg-surface rounded-2xl px-5 py-4 text-text-primary text-base border border-white/5"
                selectionColor="#B2ACC0"
              />
            </Animated.View>
          )}

          <View className="mt-8">
            <Button
              title="Save"
              variant="primary"
              size="lg"
              fullWidth
              loading={isPending}
              onPress={handleSave}
            />
          </View>

          <Text className="text-text-muted text-sm leading-relaxed mt-6 text-center">
            Not a streak. A record of who you're becoming — one choice at a time.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
