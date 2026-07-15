import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

const COLORS = ['#5B8DD9', '#5DB87D', '#D9A84A', '#B56FB8'] as const;
const BTN_SIZE = 150;
const DELAY = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = 'idle' | 'watching' | 'inputting' | 'failed';

function SimonButton({
  index,
  isLit,
  onPress,
  disabled,
}: {
  index: number;
  isLit: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const opacity = useSharedValue(0.28);

  useEffect(() => {
    opacity.value = withTiming(isLit ? 1 : 0.28, { duration: 100 });
  }, [isLit]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={disabled ? undefined : onPress}>
      <Animated.View
        style={[
          {
            width: BTN_SIZE,
            height: BTN_SIZE,
            borderRadius: 24,
            backgroundColor: COLORS[index],
          },
          animStyle,
        ]}
      />
    </Pressable>
  );
}

export default function SimonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isMounted = useRef(true);

  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [best, setBest] = useState(0);

  const sequenceRef = useRef<number[]>([]);
  const userInputRef = useRef<number[]>([]);

  const showSequence = useCallback(async (seq: number[]) => {
    if (!isMounted.current) return;
    setPhase('watching');
    setUserInput([]);
    userInputRef.current = [];
    await DELAY(400);
    for (const btn of seq) {
      if (!isMounted.current) return;
      setHighlighted(btn);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await DELAY(550);
      if (!isMounted.current) return;
      setHighlighted(null);
      await DELAY(250);
    }
    if (!isMounted.current) return;
    setPhase('inputting');
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const first = [Math.floor(Math.random() * 4)];
    sequenceRef.current = first;
    setSequence(first);
    const t = setTimeout(() => showSequence(first), 1100);
    return () => {
      isMounted.current = false;
      clearTimeout(t);
    };
  }, []);

  const handleBtnPress = useCallback(
    (index: number) => {
      if (phase !== 'inputting') return;

      setHighlighted(index);
      setTimeout(() => setHighlighted(null), 200);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newInput = [...userInputRef.current, index];
      const pos = newInput.length - 1;

      if (sequenceRef.current[pos] !== index) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setBest((b) => Math.max(b, sequenceRef.current.length - 1));
        setPhase('failed');
        return;
      }

      userInputRef.current = newInput;
      setUserInput(newInput);

      if (newInput.length === sequenceRef.current.length) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const nextSeq = [...sequenceRef.current, Math.floor(Math.random() * 4)];
        sequenceRef.current = nextSeq;
        setSequence(nextSeq);
        userInputRef.current = [];
        setUserInput([]);
        setTimeout(() => showSequence(nextSeq), 700);
      }
    },
    [phase, showSequence],
  );

  const restart = useCallback(() => {
    const first = [Math.floor(Math.random() * 4)];
    sequenceRef.current = first;
    userInputRef.current = [];
    setSequence(first);
    setUserInput([]);
    setPhase('idle');
    setTimeout(() => showSequence(first), 600);
  }, [showSequence]);

  const level = sequence.length;
  const isDisabled = phase !== 'inputting';

  const statusText = () => {
    if (phase === 'idle') return 'Get ready…';
    if (phase === 'watching') return 'Watch…';
    if (phase === 'inputting') return `Your turn — ${userInput.length} of ${level}`;
    return `Level ${level - 1}${best > 0 ? ` · best ${best}` : ''}`;
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#15141A',
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
          <Text style={{ color: '#8E8798', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#F3F0F4',
              fontSize: 26,
              fontFamily: 'Inter_600SemiBold',
              ...headingShadow,
            }}
          >
            Pattern.
          </Text>
          <Text style={{ color: '#8E8798', fontSize: 15, marginTop: 2 }}>
            {statusText()}
          </Text>
        </View>
        {phase !== 'failed' && level > 0 && (
          <Text
            style={{
              color: '#686271',
              fontSize: 15,
              fontFamily: 'Inter_600SemiBold',
            }}
          >
            Lv {level}
          </Text>
        )}
      </View>

      {/* Buttons */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 14,
            width: 2 * BTN_SIZE + 14,
          }}
        >
          {COLORS.map((_, i) => (
            <SimonButton
              key={i}
              index={i}
              isLit={highlighted === i}
              onPress={() => handleBtnPress(i)}
              disabled={isDisabled}
            />
          ))}
        </View>

        {phase === 'failed' && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ marginTop: 40, alignItems: 'center', gap: 12 }}
          >
            <Pressable
              onPress={restart}
              style={{
                backgroundColor: '#272330',
                borderRadius: 18,
                paddingHorizontal: 44,
                paddingVertical: 18,
                borderWidth: 1,
                borderColor: 'rgba(243, 240, 244, 0.10)',
              }}
            >
              <Text
                style={{
                  color: '#F3F0F4',
                  fontSize: 17,
                  fontFamily: 'Inter_600SemiBold',
                  textAlign: 'center',
                }}
              >
                Try again
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ color: '#8E8798', fontSize: 15, textAlign: 'center' }}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
