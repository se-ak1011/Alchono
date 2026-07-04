import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RESOURCE_SECTIONS, SWAPS_SECTION } from '@/lib/resources';
import { useAuthStore } from '@/store/authStore';
import { headingShadow } from '@/styles';

export default function ResourcesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const interested = (profile?.preferences as any)?.interestedInAlternatives === true;
  const sections = interested ? [...RESOURCE_SECTIONS, SWAPS_SECTION] : RESOURCE_SECTIONS;

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
        <Text
          className="text-text-primary text-2xl font-semibold tracking-tight"
          style={headingShadow}
        >
          Resources.
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-text-muted text-sm leading-relaxed mb-5">
          UK services. All free unless noted. If you're outside the UK, local
          emergency services are always the right first call.
        </Text>

        {sections.map((section) => (
          <View key={section.heading} className="mb-6">
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3">
              {section.heading}
            </Text>
            {section.items.map((r) => (
              <Pressable
                key={r.title}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (r.url.startsWith('internal:')) {
                    router.push(r.url.replace('internal:', '') as any);
                  } else {
                    Linking.openURL(r.url).catch(() => {});
                  }
                }}
                className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5 active:border-white/20"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-text-primary font-semibold text-base flex-1 pr-3">
                    {r.title}
                  </Text>
                  <Text className="text-text-muted text-sm">→</Text>
                </View>
                <Text className="text-text-secondary text-sm leading-relaxed mb-2">
                  {r.description}
                </Text>
                <Text className="text-text-muted text-sm font-medium">{r.action}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
