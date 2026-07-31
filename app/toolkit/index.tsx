import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { ZoneChip } from '@/components/ui/ZoneChip';
import { OrbitChip } from '@/components/ui/OrbitChip';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  toolsByCategory,
  type ToolkitCategory,
} from '@/lib/toolkit';
import { useCompanion } from '@/hooks/useCompanion';
import { ZONES } from '@/lib/zones';
import { headingShadow } from '@/styles';

const READING = ZONES.reading;

// One quiet icon per category, so the chips read like the rest of the app.
const CATEGORY_ICON: Record<ToolkitCategory, keyof typeof Feather.glyphMap> = {
  'in-the-moment': 'zap',
  understand: 'book-open',
  triggers: 'alert-triangle',
  'planning-ahead': 'calendar',
  stress: 'wind',
  sleep: 'moon',
  relationships: 'users',
  identity: 'compass',
  'after-a-slip': 'refresh-ccw',
  motivation: 'star',
};

export default function ToolkitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pose } = useCompanion();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ZoneGlow zone="reading" />
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center gap-4 px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ ...headingShadow, fontSize: 34 }}>Reading Corner</Text>
          <Text style={{ color: '#817B91', fontSize: 15, marginTop: 2 }}>
            Small, practical things that actually help.
          </Text>
        </View>
      </Animated.View>

      {/* Companion front and centre, like Home. */}
      <View className="pt-1 pb-4 items-center">
        <CompanionArt source={pose('reading')} width={186} height={220} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* One chip per category — title + subtitle, the reading heather accent. */}
        {CATEGORY_ORDER.map((cat, i) => {
          const meta = CATEGORY_META[cat];
          const count = toolsByCategory(cat).length;
          if (count === 0) return null;
          return (
            <Animated.View
              key={cat}
              entering={FadeInDown.duration(300).delay(Math.min(i * 40, 320))}
            >
              <ZoneChip
                icon={CATEGORY_ICON[cat]}
                accent={READING.accent}
                title={meta.label}
                subtitle={meta.blurb}
                meta={`${count} ${count === 1 ? 'read' : 'reads'}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/toolkit/c/[cat]', params: { cat } });
                }}
              />
            </Animated.View>
          );
        })}

        {/* The one chip we want everywhere. */}
        <View className="items-center mt-3 mb-1">
          <OrbitChip
            label={ZONES.urge.label}
            emergency
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.push(ZONES.urge.route as any);
            }}
          />
        </View>

        {/* Gentle safety note */}
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
      </ScrollView>
    </View>
  );
}
