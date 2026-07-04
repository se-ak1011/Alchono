import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { TOOLKIT, KIND_META, KIND_ORDER, type ToolkitKind } from '@/lib/toolkit';
import { useToolkitFavourites } from '@/hooks/useToolkitFavourites';
import { headingShadow } from '@/styles';

type Filter = ToolkitKind | 'all' | 'saved';

export default function ToolkitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSaved, toggle } = useToolkitFavourites();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      TOOLKIT.filter((t) => {
        if (filter === 'saved' && !isSaved(t.id)) return false;
        if (filter !== 'all' && filter !== 'saved' && t.kind !== filter) return false;
        if (
          q &&
          !t.title.toLowerCase().includes(q) &&
          !t.teaser.toLowerCase().includes(q)
        )
          return false;
        return true;
      }),
    [q, filter, isSaved],
  );

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    ...KIND_ORDER.map((k) => ({ key: k as Filter, label: KIND_META[k].short })),
    { key: 'saved', label: 'Saved' },
  ];

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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 12,
        }}
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

      {/* Search */}
      <View className="px-6 mb-3">
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

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        style={{ maxHeight: 44, marginBottom: 8 }}
      >
        {chips.map((c) => {
          const active = filter === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(c.key);
              }}
              className={`px-4 py-2 rounded-full border ${
                active
                  ? 'bg-accent/20 border-accent/40'
                  : 'bg-surface border-white/8'
              }`}
              style={{ height: 36, justifyContent: 'center' }}
            >
              <Text
                className={`text-sm font-medium ${
                  active ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {visible.length === 0 ? (
          <View className="py-16 items-center px-6">
            <Text className="text-text-muted text-base text-center leading-relaxed">
              {filter === 'saved'
                ? 'Nothing saved yet. Tap the bookmark on any tool to keep it here.'
                : 'Nothing matches that. Try another word.'}
            </Text>
          </View>
        ) : (
          visible.map((t, i) => (
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
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-2">
                    <View className="px-2.5 py-1 rounded-full bg-surface-2 border border-white/10">
                      <Text className="text-text-muted text-xs font-medium">
                        {KIND_META[t.kind].short}
                      </Text>
                    </View>
                    <Text className="text-text-muted text-xs">{t.minutes} min</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggle(t.id);
                    }}
                    hitSlop={12}
                  >
                    <Text className={isSaved(t.id) ? 'text-accent text-lg' : 'text-text-muted text-lg'}>
                      {isSaved(t.id) ? '★' : '☆'}
                    </Text>
                  </Pressable>
                </View>
                <Text className="text-text-primary text-lg font-semibold">
                  {t.title}
                </Text>
                <Text className="text-text-secondary text-sm leading-relaxed mt-0.5">
                  {t.teaser}
                </Text>
              </Pressable>
            </Animated.View>
          ))
        )}

        {/* Gentle safety note — always visible at the foot of the library */}
        <View className="bg-surface rounded-2xl px-5 py-4 mt-3 border border-white/8">
          <Text className="text-text-secondary text-sm leading-relaxed">
            This is self-help, not medical advice. If you drink heavily every
            day, stopping suddenly can be dangerous — please talk to a doctor
            about cutting down safely.
          </Text>
          <Pressable
            onPress={() => router.push('/support/sos')}
            className="mt-3 self-start"
            hitSlop={8}
          >
            <Text className="text-accent text-sm font-semibold">
              Need someone right now? →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
