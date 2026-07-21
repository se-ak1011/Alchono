import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

type GameId = 'memory' | 'pattern' | 'odd' | 'colour' | 'word';

const GAMES: ReadonlyArray<{
  id: GameId;
  route: string;
  name: string;
  desc: string;
  duration: string;
}> = [
  {
    id: 'memory',
    route: '/session/memory-match',
    name: 'Memory Match',
    desc: 'Flip cards. Find the pairs.',
    duration: '≈3 min',
  },
  {
    id: 'pattern',
    route: '/session/simon',
    name: 'Pattern',
    desc: 'Watch. Remember. Repeat.',
    duration: '≈2 min',
  },
  {
    id: 'odd',
    route: '/session/odd-one-out',
    name: 'Odd One Out',
    desc: 'One shade is different. Find it.',
    duration: '≈2 min',
  },
  {
    id: 'colour',
    route: '/session/stroop',
    name: 'Colour Match',
    desc: 'Tap the ink colour, not the word.',
    duration: '≈3 min',
  },
  {
    id: 'word',
    route: '/session/word-search',
    name: 'Word Search',
    desc: 'No list, no clock. Happy words are hiding — just look.',
    duration: '≈4 min',
  },
];

const ivory = '#ECE9F1';
const muted = '#7B8088';
const violet = '#8D7AAE';
const card = '#383243';
const hairline = 'rgba(255,255,255,0.08)';

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function Preview({ id, tick, reduceMotion }: { id: GameId; tick: number; reduceMotion: boolean }) {
  switch (id) {
    case 'memory':
      return <MemoryPreview tick={tick} reduceMotion={reduceMotion} />;
    case 'pattern':
      return <PatternPreview tick={tick} reduceMotion={reduceMotion} />;
    case 'odd':
      return <OddPreview />;
    case 'colour':
      return <ColourPreview tick={tick} reduceMotion={reduceMotion} />;
    case 'word':
      return <WordPreview tick={tick} reduceMotion={reduceMotion} />;
  }
}

function MemoryPreview({ tick, reduceMotion }: { tick: number; reduceMotion: boolean }) {
  const active = reduceMotion ? 1 : tick % 6;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 132 }}>
      {Array.from({ length: 6 }).map((_, index) => {
        const faceUp = index === 1 || index === 4 || index === active;
        return (
          <View
            key={index}
            style={{
              width: 36,
              height: 48,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: faceUp ? 'rgba(141,122,174,0.20)' : '#202225',
              borderWidth: 1,
              borderColor: faceUp ? 'rgba(190,177,214,0.34)' : 'rgba(255,255,255,0.07)',
              transform: [{ scaleX: faceUp ? 1 : 0.92 }],
            }}
          >
            {faceUp ? <Text style={{ color: '#BEB1D6', fontSize: 18 }}>✦</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function PatternPreview({ tick, reduceMotion }: { tick: number; reduceMotion: boolean }) {
  const sequence = [0, 2, 3, 1];
  const active = reduceMotion ? -1 : sequence[tick % sequence.length];

  return (
    <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
      {[0, 1, 2, 3].map((index) => (
        <View
          key={index}
          style={{
            width: active === index ? 45 : 38,
            height: active === index ? 45 : 38,
            borderRadius: 23,
            backgroundColor: active === index ? 'rgba(141,122,174,0.32)' : 'rgba(244,241,237,0.08)',
            borderWidth: 1,
            borderColor: active === index ? 'rgba(190,177,214,0.46)' : 'rgba(255,255,255,0.08)',
          }}
        />
      ))}
    </View>
  );
}

function OddPreview() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: 134 }}>
      {Array.from({ length: 12 }).map((_, index) => (
        <View
          key={index}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: index === 7 ? 'rgba(244,241,237,0.16)' : 'rgba(244,241,237,0.11)',
            borderWidth: 1,
            borderColor: index === 7 ? 'rgba(141,122,174,0.30)' : 'rgba(255,255,255,0.07)',
          }}
        />
      ))}
    </View>
  );
}

function ColourPreview({ tick, reduceMotion }: { tick: number; reduceMotion: boolean }) {
  const shifted = !reduceMotion && tick % 2 === 1;
  const rows = shifted
    ? [
        ['RED', '#7D97B8'],
        ['GREEN', violet],
        ['BLUE', ivory],
      ]
    : [
        ['GREEN', violet],
        ['BLUE', ivory],
        ['RED', '#7D97B8'],
      ];

  return (
    <View style={{ gap: 8 }}>
      {rows.map(([word, color]) => (
        <Text key={word} style={{ color, fontSize: 22, letterSpacing: 2, fontFamily: 'Inter_700Bold' }}>
          {word}
        </Text>
      ))}
    </View>
  );
}

function WordPreview({ tick, reduceMotion }: { tick: number; reduceMotion: boolean }) {
  const letters = ['C', 'A', 'L', 'M', 'E', 'B', 'R', 'A', 'V', 'E', 'H', 'O', 'P', 'E', 'S', 'T'];
  const wordOne = [0, 1, 2, 3];
  const wordTwo = [10, 11, 12, 13];
  const highlighted = reduceMotion || tick % 2 === 0 ? wordOne : wordTwo;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 128 }}>
      {letters.map((letter, index) => {
        const isHighlighted = highlighted.includes(index);
        return (
          <View
            key={`${letter}-${index}`}
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: isHighlighted ? 'rgba(141,122,174,0.20)' : 'transparent',
            }}
          >
            <Text style={{ color: isHighlighted ? ivory : '#656B73', fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
              {letter}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [tick, setTick] = useState(0);
  const { from } = useLocalSearchParams<{ from?: string }>();
  // Games opened during an urge carry the context through, so finishing
  // asks "did it pass?". Opened casually, they're just games.
  const suffix = from === 'urge' ? '?from=urge' : '';

  useEffect(() => {
    if (reduceMotion) return;

    const interval = setInterval(() => setTick((current) => current + 1), 3200);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
      }}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 30,
                ...headingShadow,
              }}
            >
              Games.
            </Text>
            <Text style={{ color: '#8B929B', fontSize: 15, marginTop: 4, lineHeight: 21 }}>
              Premium little exercises for a busy mind.
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 28, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {GAMES.map((game, index) => (
          <Animated.View key={game.id} entering={FadeInDown.duration(360).delay(index * 70)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${game.name}. ${game.desc} ${game.duration}`}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push((game.route + suffix) as any);
              }}
              style={{
                height: 248,
                backgroundColor: card,
                borderRadius: 28,
                padding: 20,
                borderWidth: 1,
                borderColor: hairline,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  minHeight: 118,
                  borderRadius: 22,
                  backgroundColor: '#111214',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <View
                  style={{
                    position: 'absolute',
                    top: -36,
                    right: -20,
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: 'rgba(141,122,174,0.10)',
                  }}
                />
                <Preview id={game.id} tick={tick + index} reduceMotion={reduceMotion} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: ivory, fontSize: 21, fontFamily: 'Inter_700Bold', marginBottom: 6 }}>
                  {game.name}
                </Text>
                <Text style={{ color: muted, fontSize: 15, lineHeight: 21, paddingRight: 54 }}>{game.desc}</Text>
              </View>

              <Text style={{ position: 'absolute', right: 20, bottom: 20, color: '#8D7AAE', fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
                {game.duration}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
