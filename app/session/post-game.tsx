import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { headingShadow } from '@/styles';

export default function PostGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleUrgePassed = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)' as any);
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
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ZoneGlow zone="games" intensity={0.55} />
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
          style={{ alignItems: 'center', marginBottom: 64 }}
        >
          <Text
            style={{
              color: '#ECE9F1',
              fontSize: 44,
              fontFamily: 'Inter_600SemiBold',
              marginBottom: 16,
              textAlign: 'center',
              ...headingShadow,
            }}
          >
            Well done
          </Text>
          <Text
            style={{
              color: '#B2ACC0',
              fontSize: 17,
              lineHeight: 28,
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
          style={{ width: '100%', gap: 14 }}
        >
          <Pressable
            onPress={handleUrgePassed}
            style={{
              backgroundColor: '#A489DE',
              borderRadius: 18,
              paddingVertical: 20,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#201D28',
                fontSize: 17,
                fontFamily: 'Inter_600SemiBold',
              }}
            >
              It passed.
            </Text>
          </Pressable>

          <Pressable
            onPress={handlePlayAnother}
            style={{
              backgroundColor: '#383243',
              borderRadius: 18,
              paddingVertical: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(243, 240, 244, 0.10)',
            }}
          >
            <Text
              style={{
                color: '#ECE9F1',
                fontSize: 17,
                fontFamily: 'Inter_500Medium',
              }}
            >
              Play another game
            </Text>
          </Pressable>

          <Pressable
            onPress={handleStillNeedHelp}
            style={{ paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#817B91', fontSize: 16 }}>
              I still need help →
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
