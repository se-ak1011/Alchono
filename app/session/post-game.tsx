import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

export default function PostGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleUrgePassed = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.navigate('/(tabs)' as any);
  };

  const handlePlayAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/session/games');
  };

  const handleStillNeedHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/session/urge');
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0F10',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        {/* Affirmation */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={{ alignItems: 'center', marginBottom: 56 }}
        >
          <Text
            style={{
              color: '#F0F2F4',
              fontSize: 34,
              fontFamily: 'Inter_600SemiBold',
              marginBottom: 14,
              textAlign: 'center',
              ...headingShadow,
            }}
          >
            Well done.
          </Text>
          <Text
            style={{
              color: '#9CA3AF',
              fontSize: 15,
              lineHeight: 24,
              textAlign: 'center',
            }}
          >
            That's how you break the pattern.{'\n'}
            One moment at a time.
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(220)}
          style={{ width: '100%', gap: 12 }}
        >
          <Pressable
            onPress={handleUrgePassed}
            style={{
              backgroundColor: '#C4C9D0',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#0E0F10',
                fontSize: 15,
                fontFamily: 'Inter_600SemiBold',
              }}
            >
              The urge passed.
            </Text>
          </Pressable>

          <Pressable
            onPress={handlePlayAnother}
            style={{
              backgroundColor: '#161718',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text
              style={{
                color: '#F0F2F4',
                fontSize: 15,
                fontFamily: 'Inter_500Medium',
              }}
            >
              Play another game
            </Text>
          </Pressable>

          <Pressable
            onPress={handleStillNeedHelp}
            style={{ paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#6B7280', fontSize: 14 }}>
              I still need help →
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
