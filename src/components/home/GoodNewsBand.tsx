import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useGoodNews } from '@/hooks/useGoodNews';

const ROTATE_MS = 8000;
const DOTS = 5;

/**
 * Food for the Soul, in miniature — a calm footer on Home. One real, complete
 * summary at a time (never truncated), cross-fading every few seconds. Tap to
 * open the full feed. A small window of warmth, deliberately outside the orbit.
 * No emojis, no external links.
 */
export function GoodNewsBand() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: items = [] } = useGoodNews();
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const count = items.length;

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % count;
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
          Animated.timing(opacity, { toValue: 1, duration: 340, useNativeDriver: true }).start();
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
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/soul');
      }}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#231F2C',
        borderTopWidth: 1,
        borderTopColor: 'rgba(236,233,241,0.08)',
        paddingTop: 14,
        paddingHorizontal: 22,
        paddingBottom: insets.bottom + 12,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text
          style={{ fontFamily: 'SkinnyCustard', fontSize: 17, letterSpacing: 0.5, color: '#C7B58A' }}
        >
          Food for the Soul
        </Text>
        <Feather name="chevron-right" size={16} color="#817B91" />
      </View>

      <Animated.View style={{ opacity, marginTop: 6 }}>
        <Text
          className="text-text-primary"
          style={{ fontSize: 14.5, lineHeight: 20, fontFamily: 'Inter_400Regular' }}
          numberOfLines={4}
        >
          {item.summary}
        </Text>
        {item.source ? (
          <Text className="text-text-muted" style={{ fontSize: 11.5, marginTop: 6 }}>
            {item.source}
          </Text>
        ) : null}
      </Animated.View>

      {count > 1 && (
        <View style={{ position: 'absolute', right: 22, bottom: insets.bottom + 12, flexDirection: 'row', gap: 5 }}>
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
