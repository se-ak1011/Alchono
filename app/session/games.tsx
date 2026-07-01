import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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
    id: 'words',
    route: '/session/word-search',
    name: 'Word Search',
    desc: 'Find the words. One drag at a time.',
    symbol: '◇',
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
        style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: '#6B7280', fontSize: 18 }}>←</Text>
          </Pressable>
          <View>
            <Text
              style={{
                color: '#F0F2F4',
                fontSize: 26,
                fontFamily: 'Inter_600SemiBold',
                ...headingShadow,
              }}
            >
              Games.
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 2 }}>
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
                  router.push(game.route as any);
                }}
                style={{
                  backgroundColor: '#161718',
                  borderRadius: 22,
                  padding: 22,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  minHeight: 155,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#3D4450', fontSize: 30 }}>{game.symbol}</Text>
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: '#F0F2F4',
                      fontSize: 17,
                      fontFamily: 'Inter_600SemiBold',
                      marginBottom: 5,
                    }}
                  >
                    {game.name}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 19 }}>
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
                  router.push(game.route as any);
                }}
                style={{
                  backgroundColor: '#161718',
                  borderRadius: 22,
                  padding: 22,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  minHeight: 155,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#3D4450', fontSize: 30 }}>{game.symbol}</Text>
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: '#F0F2F4',
                      fontSize: 17,
                      fontFamily: 'Inter_600SemiBold',
                      marginBottom: 5,
                    }}
                  >
                    {game.name}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 19 }}>
                    {game.desc}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}
