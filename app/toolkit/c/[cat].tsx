import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  CATEGORY_META,
  toolsByCategory,
  type ToolkitCategory,
} from '@/lib/toolkit';
import { useToolkitFavourites } from '@/hooks/useToolkitFavourites';
import { headingShadow } from '@/styles';

export default function ToolkitCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const { isSaved } = useToolkitFavourites();

  const meta = CATEGORY_META[cat as ToolkitCategory];
  const tools = meta ? toolsByCategory(cat as ToolkitCategory) : [];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#15141A',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center gap-4 px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#8E8798', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ ...headingShadow, fontSize: 26 }}>
            {meta?.label ?? 'Toolkit'}
          </Text>
          {!!meta && (
            <Text style={{ color: '#8E8798', fontSize: 15, marginTop: 2 }}>
              {meta.blurb}
            </Text>
          )}
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {tools.map((t, i) => (
          <Animated.View
            key={t.id}
            entering={FadeInDown.duration(300).delay(Math.min(i * 50, 300))}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/toolkit/[id]', params: { id: t.id } });
              }}
              className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5 active:border-white/20"
              style={{ borderTopColor: 'rgba(200, 185, 220, 0.24)' }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-text-muted text-xs">{t.minutes} min read</Text>
                {isSaved(t.id) && <Text className="text-accent text-sm">★</Text>}
              </View>
              <Text className="text-text-primary text-lg font-semibold">{t.title}</Text>
              <Text className="text-text-secondary text-sm leading-relaxed mt-0.5">
                {t.teaser}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
