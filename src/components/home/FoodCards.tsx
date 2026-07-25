import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoodNews } from '@/hooks/useGoodNews';
import { useCuratedStories } from '@/hooks/useCuratedStories';
import { useDilemmas } from '@/hooks/useDilemmas';
import { FOOD } from '@/lib/food';

type Preview = { id: string; title: string; body: string };

function PreviewSection({ title, route, accent, items, empty, loading }: {
  title: string; route: string; accent: string; items: Preview[]; empty: string; loading: boolean;
}) {
  const router = useRouter();
  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between px-6 mb-3">
        <Text className="text-text-primary text-xl font-semibold">{title}</Text>
        <Pressable onPress={() => router.push(route as any)} hitSlop={8} className="active:opacity-60">
          <Text style={{ color: accent, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>See More</Text>
        </Pressable>
      </View>
      {loading && items.length === 0 ? (
        <View className="h-32 items-center justify-center"><ActivityIndicator color="#817B91" /></View>
      ) : items.length === 0 ? (
        <View className="mx-6 rounded-2xl bg-surface border border-white/8 px-4 py-4"><Text className="text-text-muted text-sm">{empty}</Text></View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={300} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
          {items.slice(0, 3).map((item) => (
            <Pressable key={item.id} onPress={() => router.push(route as any)} className="bg-surface rounded-3xl border border-white/8 p-5 active:opacity-75" style={{ width: 288, minHeight: 156 }}>
              <View style={{ width: 34, height: 4, borderRadius: 2, backgroundColor: accent, marginBottom: 14 }} />
              <Text className="text-text-primary text-lg font-semibold leading-snug" numberOfLines={2}>{item.title}</Text>
              <Text className="text-text-secondary text-sm leading-relaxed mt-2" numberOfLines={3}>{item.body}</Text>
              <Feather name="arrow-right" size={16} color={accent} style={{ marginTop: 12 }} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function FoodCards() {
  const { data: soul = [], isLoading: soulLoading } = useGoodNews();
  const { data: giggles = [], isLoading: gigglesLoading } = useCuratedStories('giggle');
  const { data: thoughts = [], isLoading: thoughtLoading } = useDilemmas();
  return (
    <>
      <PreviewSection title="Food for the Soul" route="/soul" accent={FOOD.soul.accent} loading={soulLoading} empty="New inspiration coming soon." items={soul.slice(0, 3).map((x, i) => ({ id: `${i}-${x.title}`, title: x.title, body: x.summary }))} />
      <PreviewSection title="Food for Giggles" route="/giggles" accent={FOOD.giggles.accent} loading={gigglesLoading} empty="Fresh giggles are on the way." items={giggles.slice(0, 3).map((x) => ({ id: x.id, title: x.title, body: x.body }))} />
      <PreviewSection title="Food for Thought" route="/thought" accent={FOOD.thought.accent} loading={thoughtLoading} empty="New reflections are coming soon." items={thoughts.slice(0, 3).map((x) => ({ id: x.id, title: x.title, body: x.story }))} />
    </>
  );
}
