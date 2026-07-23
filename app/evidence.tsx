import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEvidence } from '@/hooks/useEvidence';
import { headingShadow } from '@/styles';

export default function EvidenceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: items, isLoading } = useEvidence();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ZoneGlow zone="me" intensity={0.55} />
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center gap-4 px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
      </Animated.View>

      {isLoading ? (
        <LoadingSpinner message="Reading your record…" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text
              className="text-text-primary text-3xl font-semibold tracking-tight mt-4 mb-4"
              style={headingShadow}
            >
              Evidence
            </Text>
            <Text className="text-text-secondary text-base leading-relaxed mb-8">
              It might not feel like you're making progress today. Here's what
              your own record actually says.
            </Text>

            {(items?.length ?? 0) === 0 ? (
              <View className="bg-surface rounded-2xl px-5 py-6 border border-white/8">
                <Text className="text-text-secondary text-base leading-relaxed">
                  Not enough yet — keep checking in, reflecting, and choosing.
                  The evidence builds itself from what you do, and it'll be here
                  waiting when you need proof.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {items!.map((item, i) => (
                  <Animated.View
                    key={item.key}
                    entering={FadeInDown.duration(400).delay(Math.min(i * 70, 500))}
                  >
                    <View
                      className="bg-surface rounded-2xl px-5 py-5 border border-white/8"
                      style={{ borderTopColor: 'rgba(200, 185, 220, 0.24)' }}
                    >
                      <Text className="text-text-primary text-lg font-medium leading-relaxed">
                        {item.text}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            <Text className="text-text-muted text-sm leading-relaxed mt-8">
              Every line is drawn from your own behaviour over time — not
              motivation, just what happened.
            </Text>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}
