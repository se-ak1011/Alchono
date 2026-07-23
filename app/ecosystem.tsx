import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import * as Haptics from 'expo-haptics';
import { headingShadow } from '@/styles';

const COMING_SOON = [
  'Nicotine',
  'Cannabis',
  'Cocaine',
  'Gambling',
  'Pornography',
  'Prescription medication',
];

/**
 * The family of apps this one belongs to. Alcohol is live (this app);
 * the rest are sibling apps in the works — each row becomes a store link
 * the day its app ships.
 */
export default function EcosystemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const comingSoon = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      `${name} — coming soon`,
      'This app is being built. It will follow the same rules as Alchono: private, judgement-free, yours.',
    );
  };

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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className="text-text-muted text-sm font-semibold tracking-[4px] uppercase mt-4">
            Alchono
          </Text>
          <Text
            className="text-text-primary text-3xl font-semibold tracking-tight mt-1 mb-8"
            style={headingShadow}
          >
            Recovery ecosystem
          </Text>

          <View className="bg-surface rounded-2xl px-5 py-4 mb-8 border border-white/8">
            <View className="flex-row items-center gap-3">
              <Text className="text-accent text-base">✓</Text>
              <View className="flex-1">
                <Text className="text-text-primary text-base font-semibold">Alcohol</Text>
                <Text className="text-text-muted text-sm mt-0.5">
                  You're here. This is Alchono.
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
            Coming soon
          </Text>
          <View style={{ gap: 8 }}>
            {COMING_SOON.map((name, i) => (
              <Animated.View
                key={name}
                entering={FadeInDown.duration(300).delay(Math.min(i * 50, 300))}
              >
                <Pressable
                  onPress={() => comingSoon(name)}
                  className="flex-row items-center gap-3 bg-surface rounded-2xl px-5 py-4 border border-white/5 active:border-white/15"
                >
                  <Text className="text-text-muted text-base">○</Text>
                  <Text className="text-text-secondary text-base font-medium flex-1">
                    {name}
                  </Text>
                  <Text className="text-text-muted text-xs">soon</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Text className="text-text-muted text-sm leading-relaxed mt-8">
            One account, one way of working: no lectures, no judgement, no
            selling your data. As each app ships, it will appear here.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
