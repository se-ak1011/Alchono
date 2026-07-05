import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ConstellationSky } from '@/components/constellation/ConstellationSky';
import { useAfDays } from '@/hooks/useVictories';
import { useAuthStore } from '@/store/authStore';
import { buildSky, currentMilestone } from '@/lib/constellation';
import { celebrationGlow } from '@/styles';

function formatDay(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ConstellationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: dates = [] } = useAfDays();
  const userId = useAuthStore((s) => s.user?.id) ?? 'anon';
  const sky = useMemo(() => buildSky(dates, userId), [dates, userId]);
  const milestone = currentMilestone(dates.length);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="flex-1" style={{ backgroundColor: '#060509' }}>
      {dates.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-text-secondary text-lg text-center leading-relaxed">
            Your sky is dark for now.
          </Text>
          <Text className="text-text-muted text-base text-center leading-relaxed mt-3">
            Mark your first alcohol-free day, and the first star appears. Every
            sober day lights another — and they stay lit for good.
          </Text>
        </View>
      ) : (
        <ConstellationSky sky={sky} onSelectStar={setSelected} />
      )}

      {/* Ito, watching the sky fill — bottom-left, never blocking the stars */}
      <Image
        source={require('../assets/companions/companion_constellation.png')}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 4,
          bottom: insets.bottom,
          width: 150,
          height: 200,
          resizeMode: 'contain',
          opacity: 0.92,
        }}
      />

      {/* Header overlay — box-none lets taps fall through to the sky */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}
        className="px-6"
      >
        <Pressable onPress={() => router.back()} hitSlop={12} className="self-start">
          <Text className="text-text-muted text-base">Close</Text>
        </Pressable>
        <Text
          className="text-text-primary text-3xl font-semibold tracking-tight mt-3"
          style={celebrationGlow}
        >
          Your sky
        </Text>
        <Text className="text-text-secondary text-sm mt-2">
          {dates.length} {dates.length === 1 ? 'star' : 'stars'} · one for every
          alcohol-free day
        </Text>
        {milestone && (
          <Text className="text-text-muted text-sm mt-1 italic">{milestone}</Text>
        )}
      </View>

      {/* Selected day */}
      {selected && (
        <Animated.View
          entering={FadeInUp.duration(250)}
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 20 }}
          className="px-6"
        >
          <View className="bg-surface-2 rounded-2xl px-5 py-5 border border-white/10">
            <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-1">
              Alcohol-free day
            </Text>
            <Text className="text-text-primary text-lg font-semibold">
              {formatDay(selected)}
            </Text>
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelected(null);
                  router.push('/timeline');
                }}
                className="flex-1 bg-surface rounded-xl py-3 items-center border border-white/10 active:border-white/25"
              >
                <Text className="text-text-secondary text-sm font-semibold">
                  See this day
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelected(null)}
                className="px-5 rounded-xl py-3 items-center justify-center"
              >
                <Text className="text-text-muted text-sm">Close</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
