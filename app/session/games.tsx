import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

const GAMES = [
  {
    id: 'memory',
    route: '/session/memory-match',
    name: 'Memory Match',
    desc: 'Flip cards. Find the pairs.',
    symbol: '◈',
  },
  {
    id: 'pattern',
    route: '/session/simon',
    name: 'Pattern',
    desc: 'Watch. Remember. Repeat.',
    symbol: '◉',
  },
  {
    id: 'odd',
    route: '/session/odd-one-out',
    name: 'Odd One Out',
    desc: 'One shade is different. Find it.',
    symbol: '◎',
  },
  {
    id: 'colour',
    route: '/session/stroop',
    name: 'Colour Match',
    desc: 'Tap the ink colour, not the word.',
    symbol: '●',
  },
] as const;

export default function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  // Games opened during an urge carry the context through, so finishing
  // asks "did it pass?". Opened casually, they're just games.
  const suffix = from === 'urge' ? '?from=urge' : '';

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
        style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: '#8E8798', fontSize: 18 }}>←</Text>
          </Pressable>
          <View>
            <Text
              style={{
                color: '#F3F0F4',
                fontSize: 26,
                fontFamily: 'Inter_600SemiBold',
                ...headingShadow,
              }}
            >
              Games.
            </Text>
            <Text style={{ color: '#8E8798', fontSize: 15, marginTop: 2 }}>
              3–5 minutes. Give your mind something else.
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 24 }}>
        {/* Left column */}
        <View style={{ flex: 1, gap: 14 }}>
          {GAMES.filter((_, i) => i % 2 === 0).map((game, i) => (
            <Animated.View key={game.id} entering={FadeInDown.duration(300).delay(i * 80)}>
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push((game.route + suffix) as any);
                }}
                style={{
                  backgroundColor: '#211E29',
                  borderRadius: 22,
                  padding: 22,
                  borderWidth: 1,
                  borderColor: 'rgba(243, 240, 244, 0.10)',
                  minHeight: 155,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#686271', fontSize: 30 }}>{game.symbol}</Text>
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: '#F3F0F4',
                      fontSize: 17,
                      fontFamily: 'Inter_600SemiBold',
                      marginBottom: 5,
                    }}
                  >
                    {game.name}
                  </Text>
                  <Text style={{ color: '#8E8798', fontSize: 14, lineHeight: 19 }}>
                    {game.desc}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Right column */}
        <View style={{ flex: 1, gap: 14 }}>
          {GAMES.filter((_, i) => i % 2 === 1).map((game, i) => (
            <Animated.View key={game.id} entering={FadeInDown.duration(300).delay(i * 80 + 40)}>
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push((game.route + suffix) as any);
                }}
                style={{
                  backgroundColor: '#211E29',
                  borderRadius: 22,
                  padding: 22,
                  borderWidth: 1,
                  borderColor: 'rgba(243, 240, 244, 0.10)',
                  minHeight: 155,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#686271', fontSize: 30 }}>{game.symbol}</Text>
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: '#F3F0F4',
                      fontSize: 17,
                      fontFamily: 'Inter_600SemiBold',
                      marginBottom: 5,
                    }}
                  >
                    {game.name}
                  </Text>
                  <Text style={{ color: '#8E8798', fontSize: 14, lineHeight: 19 }}>
                    {game.desc}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Decompress — not a game, no score, no end */}
      <Animated.View entering={FadeInDown.duration(300).delay(360)} style={{ paddingHorizontal: 24, marginTop: 14 }}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/session/word-search' as any);
          }}
          style={{
            backgroundColor: '#211E29',
            borderRadius: 22,
            padding: 22,
            borderWidth: 1,
            borderColor: 'rgba(243, 240, 244, 0.10)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Text style={{ color: '#686271', fontSize: 30 }}>◇</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#F3F0F4',
                fontSize: 17,
                fontFamily: 'Inter_600SemiBold',
                marginBottom: 5,
              }}
            >
              Word Search
            </Text>
            <Text style={{ color: '#8E8798', fontSize: 14, lineHeight: 19 }}>
              No list, no clock. Happy words are hiding — just look.
            </Text>
          </View>
          <Text style={{ color: '#8E8798', fontSize: 16 }}>→</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
