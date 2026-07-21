import React, { useEffect } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { celebrationGlow } from '@/styles';
import {
  useLetter,
  useMarkDelivered,
  useReactToLetter,
  daysAgo,
} from '@/hooks/useLetters';

const REACTIONS = [
  { key: 'needed_this', emoji: '❤️', label: 'I needed this' },
  { key: 'wrote_back', emoji: '💬', label: 'Write one back' },
  { key: 'keep_moving', emoji: '🌱', label: 'Keep moving' },
] as const;

export default function LetterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: letter, isLoading } = useLetter(id);
  const { mutate: markDelivered } = useMarkDelivered();
  const { mutate: react } = useReactToLetter();

  // Opening a letter delivers it — it surfaces exactly once.
  useEffect(() => {
    if (letter && !letter.delivered_at) markDelivered(letter.id);
  }, [letter?.id]);

  const handleReaction = (key: (typeof REACTIONS)[number]['key']) => {
    if (!letter) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    react({ id: letter.id, reaction: key });
    if (key === 'wrote_back') {
      router.replace('/letters/write');
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <SafeArea>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#A489DE" />
        </View>
      </SafeArea>
    );
  }

  if (!letter) {
    return (
      <SafeArea>
        <View className="px-6 pt-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-text-muted text-base">Close</Text>
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text-secondary text-base text-center">
            This letter couldn't be found.
          </Text>
        </View>
      </SafeArea>
    );
  }

  const days = daysAgo(letter.created_at);

  return (
    <SafeArea>
      <View className="px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-text-muted text-base">Close</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 48, paddingTop: 12 }}
      >
        <Text
          className="text-text-primary text-3xl font-semibold tracking-tight"
          style={celebrationGlow}
        >
          A letter from{'\n'}your past self.
        </Text>
        <Text className="text-text-muted text-sm mt-3 mb-10">
          Written {days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}.
        </Text>

        <Text className="text-text-primary text-xl leading-loose">
          {letter.body}
        </Text>

        <View className="mt-14">
          <Text className="text-text-secondary text-base text-center mb-5">
            How does this feel today?
          </Text>
          <View className="gap-3">
            {REACTIONS.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => handleReaction(r.key)}
                className="flex-row items-center justify-center gap-3 bg-surface rounded-2xl py-4 border border-white/8 active:border-white/25"
              >
                <Text className="text-lg">{r.emoji}</Text>
                <Text className="text-text-primary text-base font-medium">{r.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  );
}
