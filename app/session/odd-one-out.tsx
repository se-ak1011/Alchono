import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

const SCREEN_W = Dimensions.get('window').width;
const BOARD_W = Math.min(SCREEN_W - 48, 360);
const GAP = 8;

type Round = {
  dim: number;
  oddIndex: number;
  baseColor: string;
  oddColor: string;
};

function makeRound(level: number): Round {
  // Board grows, difference shrinks. Stays findable — calm, not cruel.
  const dim = Math.min(2 + Math.ceil(level / 3), 6);
  const hue = Math.floor(Math.random() * 360);
  const sat = 40 + Math.floor(Math.random() * 20);
  const light = 45 + Math.floor(Math.random() * 15);
  const delta = Math.max(5, 20 - level);
  const oddLight = light + (light > 55 ? -delta : delta);
  return {
    dim,
    oddIndex: Math.floor(Math.random() * dim * dim),
    baseColor: `hsl(${hue}, ${sat}%, ${light}%)`,
    oddColor: `hsl(${hue}, ${sat}%, ${oddLight}%)`,
  };
}

export default function OddOneOutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [level, setLevel] = useState(1);
  const [best, setBest] = useState(0);
  const [failed, setFailed] = useState(false);
  const [round, setRound] = useState<Round>(() => makeRound(1));

  const cellSize = useMemo(
    () => (BOARD_W - GAP * (round.dim - 1)) / round.dim,
    [round.dim],
  );

  const handleTap = useCallback(
    (index: number) => {
      if (failed) return;
      if (index === round.oddIndex) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const next = level + 1;
        setLevel(next);
        setRound(makeRound(next));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setBest((b) => Math.max(b, level));
        setFailed(true);
      }
    },
    [failed, round, level],
  );

  const restart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLevel(1);
    setRound(makeRound(1));
    setFailed(false);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#2A2733',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#ECE9F1',
              fontSize: 26,
              fontFamily: 'Inter_600SemiBold',
              ...headingShadow,
            }}
          >
            {failed ? 'Sharp eyes.' : 'Odd One Out.'}
          </Text>
          <Text style={{ color: '#817B91', fontSize: 15, marginTop: 2 }}>
            {failed
              ? `Level ${level}${best > level ? ` · best ${best}` : ''}`
              : 'One shade is different. Tap it.'}
          </Text>
        </View>
        {!failed && (
          <Text style={{ color: '#686271', fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
            Lv {level}
          </Text>
        )}
      </View>

      {/* Board */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {failed ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: '#ECE9F1',
                fontSize: 92,
                fontFamily: 'Inter_700Bold',
                lineHeight: 100,
              }}
            >
              {level}
            </Text>
            <Text style={{ color: '#817B91', fontSize: 17, marginTop: 4 }}>
              levels of noticing the difference
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            key={`round-${level}`}
            entering={FadeIn.duration(200)}
            style={{
              width: BOARD_W,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: GAP,
            }}
          >
            {Array.from({ length: round.dim * round.dim }, (_, i) => (
              <Pressable key={i} onPress={() => handleTap(i)}>
                <View
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: Math.max(10, cellSize / 5),
                    backgroundColor:
                      i === round.oddIndex ? round.oddColor : round.baseColor,
                  }}
                />
              </Pressable>
            ))}
          </Animated.View>
        )}
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
        {failed ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ gap: 12 }}>
            <Pressable
              onPress={restart}
              style={{
                backgroundColor: '#A489DE',
                borderRadius: 18,
                paddingVertical: 18,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#2A2733', fontSize: 17, fontFamily: 'Inter_600SemiBold' }}>
                Play again
              </Text>
            </Pressable>
            <Pressable
              onPress={() => (from === 'urge' ? router.push('/session/post-game') : router.back())}
              style={{ paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#817B91', fontSize: 15 }}>Done</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={{ color: '#817B91', fontSize: 15, textAlign: 'center' }}>Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
