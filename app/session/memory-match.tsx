import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

const EMOJIS = ['🌊', '💪', '☀️', '🌿', '🎯', '💙', '🏃', '🌟'];
const CARD_SIZE = 76;
const CARD_GAP = 12;

function seededRng(seed: number) {
  let s = ((seed >>> 0) || 1) & 0xffffffff;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const rng = seededRng(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

function MemoryCard({
  emoji,
  showFront,
  matched,
  onPress,
}: {
  emoji: string;
  showFront: boolean;
  matched: boolean;
  onPress: () => void;
}) {
  const scaleX = useSharedValue(1);
  const [displaying, setDisplaying] = useState(showFront);
  const prevRef = useRef(showFront);

  useEffect(() => {
    if (prevRef.current === showFront) return;
    prevRef.current = showFront;
    const target = showFront;
    scaleX.value = withTiming(0, { duration: 120 }, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(setDisplaying)(target);
        scaleX.value = withTiming(1, { duration: 120 });
      }
    });
  }, [showFront]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }],
  }));

  return (
    <Pressable onPress={displaying ? undefined : onPress} hitSlop={4}>
      <Animated.View
        style={[
          {
            width: CARD_SIZE,
            height: CARD_SIZE,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: displaying
              ? matched
                ? '#191B1D'
                : '#1D1F21'
              : '#161718',
            borderWidth: 1,
            borderColor: displaying
              ? matched
                ? 'rgba(196,201,208,0.18)'
                : 'rgba(255,255,255,0.12)'
              : 'rgba(255,255,255,0.06)',
          },
          animStyle,
        ]}
      >
        {displaying ? (
          <Text style={{ fontSize: 32 }}>{emoji}</Text>
        ) : (
          <Text style={{ fontSize: 18, color: '#2A2F38' }}>◇</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function MemoryMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const today = Math.floor(Date.now() / 86400000);

  const makeCards = (seed: number): Card[] => {
    const pairs = EMOJIS.flatMap((emoji, i) => [
      { id: i * 2,     emoji, flipped: false, matched: false },
      { id: i * 2 + 1, emoji, flipped: false, matched: false },
    ]);
    return shuffleWithSeed(pairs, seed);
  };

  const [cards, setCards] = useState<Card[]>(() => makeCards(today));
  const [moves, setMoves] = useState(0);
  const [complete, setComplete] = useState(false);
  const selectedRef = useRef<{ id: number; emoji: string }[]>([]);
  const isCheckingRef = useRef(false);
  const replayCountRef = useRef(0);

  const handlePress = (card: Card) => {
    if (isCheckingRef.current) return;
    if (card.flipped || card.matched) return;
    if (selectedRef.current.length >= 2) return;

    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, flipped: true } : c)));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectedRef.current = [...selectedRef.current, { id: card.id, emoji: card.emoji }];

    if (selectedRef.current.length < 2) return;

    const [first, second] = selectedRef.current;
    selectedRef.current = [];
    setMoves((m) => m + 1);

    if (first.emoji === second.emoji) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCards((prev) => {
        const updated = prev.map((c) =>
          c.id === first.id || c.id === second.id
            ? { ...c, flipped: true, matched: true }
            : c,
        );
        if (updated.every((c) => c.matched)) {
          setTimeout(() => setComplete(true), 400);
        }
        return updated;
      });
    } else {
      isCheckingRef.current = true;
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c,
          ),
        );
        isCheckingRef.current = false;
      }, 900);
    }
  };

  const resetGame = () => {
    replayCountRef.current += 1;
    setCards(makeCards(today + replayCountRef.current));
    setMoves(0);
    setComplete(false);
    selectedRef.current = [];
    isCheckingRef.current = false;
  };

  const pairsFound = cards.filter((c) => c.matched).length / 2;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0F10',
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
          <Text style={{ color: '#6B7280', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#F0F2F4',
              fontSize: 26,
              fontFamily: 'Inter_600SemiBold',
              ...headingShadow,
            }}
          >
            {complete ? 'All matched.' : 'Memory Match.'}
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 2 }}>
            {complete
              ? `${moves} moves. Not bad.`
              : `${moves} moves · ${pairsFound} of ${EMOJIS.length} pairs`}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: CARD_GAP,
            width: 4 * CARD_SIZE + 3 * CARD_GAP,
          }}
        >
          {cards.map((card) => (
            <MemoryCard
              key={card.id}
              emoji={card.emoji}
              showFront={card.flipped || card.matched}
              matched={card.matched}
              onPress={() => handlePress(card)}
            />
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
        {complete ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ gap: 12 }}>
            <Pressable
              onPress={resetGame}
              style={{
                backgroundColor: '#C4C9D0',
                borderRadius: 18,
                paddingVertical: 18,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ color: '#0E0F10', fontSize: 17, fontFamily: 'Inter_600SemiBold' }}
              >
                Play again
              </Text>
            </Pressable>
            <Pressable
              onPress={() => (from === 'urge' ? router.push('/session/post-game') : router.back())}
              style={{ paddingVertical: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#6B7280', fontSize: 15 }}>Done</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={{ color: '#6B7280', fontSize: 15, textAlign: 'center' }}>Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
