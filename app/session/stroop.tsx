import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

const COLORS = [
  { name: 'RED',    hex: '#E57373' },
  { name: 'BLUE',   hex: '#64B5F6' },
  { name: 'GREEN',  hex: '#81C784' },
  { name: 'YELLOW', hex: '#FFD54F' },
  { name: 'PINK',   hex: '#F48FB1' },
  { name: 'ORANGE', hex: '#FFB74D' },
] as const;

type ColorEntry = typeof COLORS[number];

const TOTAL_ROUNDS = 20;
// 4 circles + 3 gaps must fit inside the screen minus 24px padding each side.
// At 72px fixed, the row was 348px + 48px padding = wider than most phones.
const CIRCLE_GAP = 16;
const CIRCLE_SIZE = Math.min(
  72,
  Math.floor((Dimensions.get('window').width - 48 - CIRCLE_GAP * 3) / 4),
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Round = {
  wordName: string;
  inkHex: string;
  options: string[];
};

function makeRound(): Round {
  const [wordColor, inkColor, ...rest] = shuffle([...COLORS]) as ColorEntry[];
  const others = shuffle(rest).slice(0, 3);
  const options = shuffle([inkColor, ...others]).map((c) => c.hex);
  return { wordName: wordColor.name, inkHex: inkColor.hex, options };
}

export default function StroopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState<Round>(makeRound);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [complete, setComplete] = useState(false);

  const handleSelect = useCallback(
    (hex: string) => {
      if (selected || complete) return;
      setSelected(hex);

      const correct = hex === current.inkHex;
      setFeedback(correct ? 'correct' : 'wrong');
      if (correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScore((s) => s + 1);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setTimeout(() => {
        const next = round + 1;
        if (next >= TOTAL_ROUNDS) {
          setComplete(true);
        } else {
          setRound(next);
          setCurrent(makeRound());
          setSelected(null);
          setFeedback(null);
        }
      }, 650);
    },
    [selected, complete, current, round],
  );

  const restart = () => {
    setRound(0);
    setScore(0);
    setCurrent(makeRound());
    setSelected(null);
    setFeedback(null);
    setComplete(false);
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
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
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
            {complete ? 'Done.' : 'Colour Match.'}
          </Text>
          <Text style={{ color: '#817B91', fontSize: 15, marginTop: 2 }}>
            {complete
              ? `${score} of ${TOTAL_ROUNDS} correct`
              : 'Tap the ink colour, not the word'}
          </Text>
        </View>
        {!complete && (
          <Text style={{ color: '#686271', fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
            {round + 1}/{TOTAL_ROUNDS}
          </Text>
        )}
      </View>

      {/* Progress bar */}
      {!complete && (
        <View
          style={{
            height: 2,
            marginHorizontal: 24,
            backgroundColor: '#474151',
            borderRadius: 1,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              height: 2,
              width: `${(round / TOTAL_ROUNDS) * 100}%`,
              backgroundColor: '#A489DE',
              borderRadius: 1,
            }}
          />
        </View>
      )}

      {complete ? (
        /* Results */
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              color: '#ECE9F1',
              fontSize: 92,
              fontFamily: 'Inter_700Bold',
              lineHeight: 100,
            }}
          >
            {score}
          </Text>
          <Text style={{ color: '#817B91', fontSize: 17, marginTop: 4, marginBottom: 48 }}>
            out of {TOTAL_ROUNDS}
          </Text>
          <View style={{ gap: 12, width: '100%' }}>
            <Pressable
              onPress={restart}
              style={{
                backgroundColor: '#A489DE',
                borderRadius: 18,
                paddingVertical: 18,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ color: '#201D28', fontSize: 17, fontFamily: 'Inter_600SemiBold' }}
              >
                Play again
              </Text>
            </Pressable>
            <Pressable
              onPress={() => (from === 'urge' ? router.push('/session/post-game') : router.back())}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#817B91', fontSize: 15 }}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        /* Game */
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          {/* Word */}
          <View style={{ alignItems: 'center', marginBottom: 64 }}>
            <Animated.Text
              key={`word-${round}`}
              entering={FadeIn.duration(150)}
              style={{
                color: current.inkHex,
                fontSize: 66,
                fontFamily: 'Inter_700Bold',
                letterSpacing: 8,
              }}
            >
              {current.wordName}
            </Animated.Text>

            {feedback && (
              <Animated.Text
                key={`fb-${round}`}
                entering={ZoomIn.duration(180)}
                style={{
                  color: feedback === 'correct' ? '#81C784' : '#E57373',
                  fontSize: 24,
                  marginTop: 14,
                }}
              >
                {feedback === 'correct' ? '✓' : '✗'}
              </Animated.Text>
            )}
          </View>

          {/* Colour options */}
          <Animated.View
            key={`options-${round}`}
            entering={FadeIn.duration(150)}
            style={{ flexDirection: 'row', gap: CIRCLE_GAP }}
          >
            {current.options.map((hex) => {
              const isSelected = selected === hex;
              const isCorrect = hex === current.inkHex;
              const revealed = !!selected;

              return (
                <Pressable
                  key={hex}
                  onPress={() => handleSelect(hex)}
                  disabled={!!selected}
                  hitSlop={8}
                >
                  <View
                    style={{
                      width: CIRCLE_SIZE,
                      height: CIRCLE_SIZE,
                      borderRadius: CIRCLE_SIZE / 2,
                      backgroundColor: hex,
                      opacity: revealed && !isSelected && !isCorrect ? 0.25 : 1,
                      borderWidth: revealed && isCorrect ? 3 : isSelected && !isCorrect ? 2 : 0,
                      borderColor: revealed && isCorrect ? '#fff' : '#E57373',
                    }}
                  />
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      )}
    </View>
  );
}
