import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { DRAWER_ZONES } from '@/lib/zones';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH * 0.82);
const DURATION = 240;

/**
 * The practical mirror of the orbit: every destination as a plain list, slid
 * in from the left. The orbit is emotional; this is for getting somewhere fast
 * and for accessibility. Keeps the same zone accents so places feel consistent.
 */
export function AppDrawer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: DURATION });
    } else {
      progress.value = withTiming(0, { duration: DURATION });
      // Unmount after the close animation, on the JS thread (no worklet hop).
      const t = setTimeout(() => setMounted(false), DURATION + 20);
      return () => clearTimeout(t);
    }
  }, [visible, progress]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-PANEL_WIDTH, 0]) },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  if (!mounted) return null;

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push(route as any);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]} pointerEvents="box-none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(10,8,14,0.55)' },
          scrimStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: PANEL_WIDTH,
            backgroundColor: '#2A2634',
            borderRightWidth: 1,
            borderRightColor: 'rgba(236,233,241,0.10)',
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 16,
          },
          panelStyle,
        ]}
      >
        <View className="flex-row items-center justify-between px-2 mb-6">
          <Text className="text-text-primary text-xl font-semibold tracking-tight">
            Where to?
          </Text>
          <Pressable onPress={onClose} hitSlop={10} className="p-1 active:opacity-60">
            <Feather name="x" size={22} color="#817B91" />
          </Pressable>
        </View>

        {DRAWER_ZONES.map((zone) => (
          <Pressable
            key={zone.key}
            onPress={() => go(zone.route)}
            className="flex-row items-center gap-4 rounded-2xl px-3 py-3.5 mb-1.5 active:opacity-70"
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: zone.tint,
                borderWidth: 1,
                borderColor: zone.edge,
              }}
            >
              <Text style={{ fontSize: 20 }}>{zone.emoji}</Text>
            </View>
            <Text className="text-text-primary text-base font-medium flex-1">
              {zone.label}
            </Text>
            <Feather name="chevron-right" size={18} color="#817B91" />
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}
