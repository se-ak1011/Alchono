import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  toolsByCategory,
} from '@/lib/toolkit';
import { useCompanion } from '@/hooks/useCompanion';
import { ZONES } from '@/lib/zones';
import { headingShadow } from '@/styles';

const READING = ZONES.reading;

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

      <View className="pt-1 pb-3 items-center">
        <CompanionArt source={pose('bust')} width={140} height={166} cropHeight={140} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-width cards, one per category — matching Games / Writing Room. */}
        {CATEGORY_ORDER.map((cat, i) => {
          const meta = CATEGORY_META[cat];
          const count = toolsByCategory(cat).length;
          if (count === 0) return null;
          return (
            <Animated.View
              key={cat}
              entering={FadeInDown.duration(300).delay(Math.min(i * 45, 360))}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/toolkit/c/[cat]', params: { cat } });
                }}
                className="bg-surface rounded-3xl px-5 py-5 mb-3 border border-white/8 active:border-white/20"
              >
                <Text className="text-text-primary text-xl font-semibold">
                  {meta.label}
                </Text>
                <Text className="text-text-secondary text-sm leading-relaxed mt-1.5">
                  {meta.blurb}
                </Text>
                {/* The zone colour, washed onto the count. */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 16,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    backgroundColor: READING.tint,
                    borderWidth: 1,
                    borderColor: READING.edge,
                  }}
                >
                  <Text
                    style={{
                      color: READING.accent,
                      fontSize: 12,
                      fontFamily: 'Inter_600SemiBold',
                    }}
                  >
                    {count} {count === 1 ? 'read' : 'reads'}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

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
