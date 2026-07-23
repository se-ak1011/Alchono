import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoodNews } from '@/hooks/useGoodNews';

const ROTATE_MS = 7000;
const DOTS = 5;

/**
 * "A little good news" — a calm footer on Home. One real headline at a time,
 * cross-fading to the next every few seconds; tap to skip. A small window of
 * warmth (human kindness + the science of wellbeing), deliberately outside the
 * orbit. No emojis, no links — just the headline and where it came from.
 */
export function GoodNewsBand() {
  const insets = useSafeAreaInsets();
  const { data: items = [] } = useGoodNews();
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  const count = items.length;

  // Advance with a soft cross-fade. Shared by the timer and tap.
  const advance = (next: number) => {
    Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setIndex(next);
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % count;
        // fade handled here so the timer and state stay in step
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
          Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
        });
        return next;
      });
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [count, opacity]);

  if (count === 0) return null;
  const item = items[Math.min(index, count - 1)];

  return (
    <Pressable
      onPress={() => count > 1 && advance((index + 1) % count)}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#231F2C',
        borderTopWidth: 1,
        borderTopColor: 'rgba(236,233,241,0.08)',
        paddingTop: 15,
        paddingHorizontal: 22,
        paddingBottom: insets.bottom + 14,
      }}
    >
      <Text
        style={{ fontFamily: 'SkinnyCustard', fontSize: 16, letterSpacing: 0.5, color: '#C7B58A' }}
      >
        A little good news
      </Text>
      <Animated.View style={{ opacity, marginTop: 7 }}>
        <Text className="text-text-primary" style={{ fontSize: 15.5, lineHeight: 21, fontFamily: 'Inter_500Medium' }} numberOfLines={2}>
          {item.headline}
        </Text>
        {item.source ? (
          <Text className="text-text-muted" style={{ fontSize: 11.5, marginTop: 6 }}>
            {item.source}
          </Text>
        ) : null}
      </Animated.View>

      {count > 1 && (
        <View style={{ position: 'absolute', right: 22, bottom: insets.bottom + 14, flexDirection: 'row', gap: 5 }}>
          {Array.from({ length: DOTS }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: i === index % DOTS ? '#C7B58A' : 'rgba(236,233,241,0.22)',
              }}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}
