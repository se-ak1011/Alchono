import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { toolById, CATEGORY_META, type ToolSection } from '@/lib/toolkit';
import { useToolkitFavourites } from '@/hooks/useToolkitFavourites';
import { headingShadow } from '@/styles';

function SectionView({ section }: { section: ToolSection }) {
  switch (section.type) {
    case 'heading':
      return (
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mt-6 mb-2">
          {section.text}
        </Text>
      );
    case 'paragraph':
      return (
        <Text className="text-text-secondary text-base leading-relaxed mb-3">
          {section.text}
        </Text>
      );
    case 'callout':
      return (
        <View
          className="bg-surface rounded-2xl px-5 py-4 my-2 border border-white/8"
          style={{ borderLeftWidth: 3, borderLeftColor: '#9B82D0' }}
        >
          <Text className="text-text-primary text-base leading-relaxed">
            {section.text}
          </Text>
        </View>
      );
    case 'steps':
      return (
        <View className="gap-2 mb-2">
          {section.items.map((item, i) => (
            <View key={i} className="flex-row gap-3">
              <View className="w-6 h-6 rounded-full bg-surface-2 border border-white/10 items-center justify-center mt-0.5">
                <Text className="text-accent text-xs font-bold">{i + 1}</Text>
              </View>
              <Text className="text-text-secondary text-base leading-relaxed flex-1">
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'list':
      return (
        <View className="gap-2 mb-2">
          {section.items.map((item, i) => (
            <View key={i} className="flex-row gap-3">
              <Text className="text-text-muted text-base mt-0.5">•</Text>
              <Text className="text-text-secondary text-base leading-relaxed flex-1">
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'lines':
      return (
        <View className="gap-2 mb-2">
          {section.items.map((item, i) => (
            <View
              key={i}
              className="bg-surface rounded-xl px-4 py-3 border border-white/5"
            >
              <Text className="text-text-primary text-base leading-relaxed">
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export default function ToolDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSaved, toggle } = useToolkitFavourites();
  const tool = toolById(id);

  if (!tool) {
    return (
      <View
        style={{ flex: 1, backgroundColor: '#15141A', paddingTop: insets.top + 16 }}
        className="px-6"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#8E8798', fontSize: 18 }}>←</Text>
        </Pressable>
        <Text className="text-text-muted text-base mt-8">
          That tool isn’t here anymore.
        </Text>
      </View>
    );
  }

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
        className="flex-row items-center justify-between px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#8E8798', fontSize: 18 }}>←</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggle(tool.id);
          }}
          hitSlop={12}
        >
          <Text className={isSaved(tool.id) ? 'text-accent text-xl' : 'text-text-muted text-xl'}>
            {isSaved(tool.id) ? '★' : '☆'}
          </Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="flex-row items-center gap-2 mb-3">
            <View className="px-2.5 py-1 rounded-full bg-surface-2 border border-white/10">
              <Text className="text-text-muted text-xs font-medium">
                {CATEGORY_META[tool.category].label}
              </Text>
            </View>
            <Text className="text-text-muted text-xs">{tool.minutes} min read</Text>
          </View>

          <Text
            className="text-text-primary text-3xl font-semibold tracking-tight leading-tight mb-5"
            style={headingShadow}
          >
            {tool.title}
          </Text>

          {tool.sections.map((section, i) => (
            <SectionView key={i} section={section} />
          ))}

          {tool.action && (
            <View className="mt-6">
              <Button
                title={tool.action.label}
                variant="primary"
                size="md"
                fullWidth
                onPress={() => router.push(tool.action!.route as any)}
              />
            </View>
          )}

          {/* Consistent gentle safety footer */}
          <Text className="text-text-muted text-xs leading-relaxed mt-8">
            Self-help, not medical advice. If stopping feels physically unsafe
            (shaking, sweating, sickness when you don’t drink), that can be
            serious — please speak to a doctor.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
