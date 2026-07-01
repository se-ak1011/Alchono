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
        style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>←</Text>
          </Pressable>
          <View>
            <Text
              style={{
                color: '#F0F2F4',
                fontSize: 20,
                fontFamily: 'Inter_600SemiBold',
                ...headingShadow,
              }}
            >
              Games.
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
              3–5 minutes. Give your mind something else.
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 24 }}>
        {/* Left column */}
        <View style={{ flex: 1, gap: 12 }}>
          {GAMES.filter((_, i) => i % 2 === 0).map((game, i) => (
            <Animated.View key={game.id} entering={FadeInDown.duration(300).delay(i * 80)}>
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(game.route as any);
                }}
                style={{
                  backgroundColor: '#161718',
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.06)',
                  minHeight: 130,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#3D4450', fontSize: 24 }}>{game.symbol}</Text>
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: '#F0F2F4',
                      fontSize: 14,
                      fontFamily: 'Inter_600SemiBold',
                      marginBottom: 4,
                    }}
                  >
                    {game.name}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 16 }}>
                    {game.desc}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Right column */}
        <View style={{ flex: 1, gap: 12 }}>
          {GAMES.filter((_, i) => i % 2 === 1).map((game, i) => (
            <Animated.View key={game.id} entering={FadeInDown.duration(300).delay(i * 80 + 40)}>
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(game.route as any);
                }}
                style={{
                  backgroundColor: '#161718',
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.06)',
                  minHeight: 130,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#3D4450', fontSize: 24 }}>{game.symbol}</Text>
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: '#F0F2F4',
                      fontSize: 14,
                      fontFamily: 'Inter_600SemiBold',
                      marginBottom: 4,
                    }}
                  >
                    {game.name}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 16 }}>
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
