import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  TOOLKIT,
  CATEGORY_META,
  CATEGORY_ORDER,
  toolsByCategory,
} from '@/lib/toolkit';
import { useToolkitFavourites } from '@/hooks/useToolkitFavourites';
import { headingShadow } from '@/styles';

export default function ToolkitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSaved } = useToolkitFavourites();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      q
        ? TOOLKIT.filter(
            (t) =>
              t.title.toLowerCase().includes(q) || t.teaser.toLowerCase().includes(q),
          )
        : [],
    [q],
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0F10',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center gap-4 px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#6B7280', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ ...headingShadow, fontSize: 26 }}>Toolkit.</Text>
          <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 2 }}>
            Small, practical things that actually help.
          </Text>
        </View>
      </Animated.View>

      {!q && (
        <View className="px-6 pt-1 pb-2 items-center">
          <Image
            source={require('../../assets/companions/image_06_reading.png')}
            style={{ width: 106, height: 118, opacity: 0.62 }}
            resizeMode="contain"
          />
        </View>
      )}

      <View className="px-6 mb-4 mt-2">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search the toolkit…"
          placeholderTextColor="#5E6472"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: '#161718',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#F0F2F4',
            fontSize: 15,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {q ? (
          // Search: flat results across all categories
          results.length === 0 ? (
            <View className="py-16 items-center px-6">
              <Text className="text-text-muted text-base text-center leading-relaxed">
                Nothing matches that. Try another word.
              </Text>
            </View>
          ) : (
            results.map((t, i) => (
              <Animated.View
                key={t.id}
                entering={FadeInDown.duration(300).delay(Math.min(i * 40, 300))}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/toolkit/[id]', params: { id: t.id } });
                  }}
                  className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5 active:border-white/20"
                  style={{ borderTopColor: 'rgba(255,255,255,0.12)' }}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-text-muted text-xs">
                      {CATEGORY_META[t.category].label} · {t.minutes} min
                    </Text>
                    {isSaved(t.id) && <Text className="text-accent text-sm">★</Text>}
                  </View>
                  <Text className="text-text-primary text-lg font-semibold">{t.title}</Text>
                  <Text className="text-text-secondary text-sm leading-relaxed mt-0.5">
                    {t.teaser}
                  </Text>
                </Pressable>
              </Animated.View>
            ))
          )
        ) : (
          // Default: a calm grid of categories, each its own page
          <View className="flex-row flex-wrap justify-between">
            {CATEGORY_ORDER.map((cat, i) => {
              const meta = CATEGORY_META[cat];
              const count = toolsByCategory(cat).length;
              if (count === 0) return null;
              return (
                <Animated.View
                  key={cat}
                  entering={FadeInDown.duration(300).delay(Math.min(i * 40, 360))}
                  style={{ width: '48%', marginBottom: 12 }}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: '/toolkit/c/[cat]', params: { cat } });
                    }}
                    className="bg-surface rounded-2xl px-4 py-5 border border-white/8 active:border-white/20"
                    style={{ borderTopColor: 'rgba(255,255,255,0.1)', minHeight: 116 }}
                  >
                    <Text className="text-text-primary text-lg font-semibold">
                      {meta.label}
                    </Text>
                    <Text className="text-text-muted text-sm leading-relaxed mt-1">
                      {meta.blurb}
                    </Text>
                    <Text className="text-text-muted text-xs mt-3">
                      {count} {count === 1 ? 'read' : 'reads'}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Gentle safety note */}
        {!q && (
          <View className="bg-surface rounded-2xl px-5 py-4 mt-3 border border-white/8">
            <Text className="text-text-secondary text-sm leading-relaxed">
              This is self-help, not medical advice. If you drink heavily every
              day, stopping suddenly can be dangerous — please talk to a doctor
              about cutting down safely.
            </Text>
            <Pressable
              onPress={() => router.push('/support/resources')}
              className="mt-3 self-start"
              hitSlop={8}
            >
              <Text className="text-accent text-sm font-semibold">
                Need someone right now? →
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
