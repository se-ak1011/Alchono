import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { headingShadow } from '@/styles';

type Option = {
  title: string;
  subtitle: string;
  route: string;
  urge?: boolean;
  warn?: boolean;
};

// Deliberately only four. Nothing to scroll past, nothing to weigh up.
const OPTIONS: Option[] = [
  {
    title: 'Talk to the AI coach',
    subtitle: 'Always awake. No judgement, any hour.',
    route: '/support/coach',
  },
  {
    title: 'Emergency help',
    subtitle: 'Crisis lines and someone to call.',
    route: '/support/resources',
  },
];

export default function HelpNowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 8,
      }}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center gap-4 px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text
            className="text-text-primary text-4xl font-semibold tracking-tight leading-tight mt-6 mb-3"
            style={headingShadow}
          >
            Right now.
          </Text>
          <Text className="text-text-secondary text-lg leading-relaxed mb-10">
            You're overwhelmed. That's okay. Pick one thing.
          </Text>

          <View style={{ gap: 14 }}>
            {OPTIONS.map((o, i) => (
              <Animated.View
                key={o.title}
                entering={FadeInDown.duration(400).delay(100 + i * 80)}
              >
                <Pressable
                  onPress={() => {
                    if (o.warn) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    } else {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push(o.route as any);
                  }}
                  className={`rounded-3xl px-6 py-6 border ${
                    o.urge
                      ? 'bg-urge-surface border-white/15 active:border-white/35'
                      : 'bg-surface border-white/8 active:border-white/20'
                  }`}
                  style={
                    o.urge
                      ? {
                          shadowColor: '#3B3352',
                          shadowOpacity: 0.8,
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 6 },
                          borderTopColor: 'rgba(200, 185, 220, 0.24)',
                        }
                      : { borderTopColor: 'rgba(200, 185, 220, 0.24)' }
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-text-primary text-xl font-semibold flex-1 pr-3">
                      {o.title}
                    </Text>
                    <Text className="text-text-muted text-lg">→</Text>
                  </View>
                  <Text className="text-text-muted text-base mt-1.5 leading-relaxed">
                    {o.subtitle}
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
