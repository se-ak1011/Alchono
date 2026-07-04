import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { headingShadow } from '@/styles';

type Row = { title: string; subtitle: string; route: string };

const ROWS: Row[] = [
  {
    title: 'Community',
    subtitle: 'Share a win, ask for help, or just read along.',
    route: '/support/community',
  },
  {
    title: 'Mentors',
    subtitle: "People who've walked it, a message away.",
    route: '/support/mentors',
  },
  {
    title: 'Learn',
    subtitle: 'The Toolkit — understand cravings, triggers, and more.',
    route: '/toolkit',
  },
  {
    title: 'Your progress',
    subtitle: 'Evidence of how far you\'ve actually come.',
    route: '/evidence',
  },
  {
    title: 'Milestones',
    subtitle: 'Your story so far, moment by moment.',
    route: '/timeline',
  },
  {
    title: 'Resources',
    subtitle: 'Helplines, meetings, and support services.',
    route: '/support/resources',
  },
];

export default function RecoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text
            className="text-text-primary text-4xl font-semibold tracking-tight leading-tight mt-6 mb-3"
            style={headingShadow}
          >
            Recovery.
          </Text>
          <Text className="text-text-secondary text-lg leading-relaxed mb-8">
            Not in a hard moment — just here. Look around.
          </Text>

          <View style={{ gap: 12 }}>
            {ROWS.map((r, i) => (
              <Animated.View
                key={r.title}
                entering={FadeInDown.duration(400).delay(100 + i * 60)}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(r.route as any);
                  }}
                  className="bg-surface rounded-2xl px-5 py-5 border border-white/8 active:border-white/20"
                  style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-text-primary text-lg font-semibold flex-1 pr-3">
                      {r.title}
                    </Text>
                    <Text className="text-text-muted text-lg">→</Text>
                  </View>
                  <Text className="text-text-muted text-sm mt-1 leading-relaxed">
                    {r.subtitle}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
