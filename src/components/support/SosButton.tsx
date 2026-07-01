import React, { useRef } from 'react';
import { Pressable, Text, View, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export function SosButton() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push('/support/sos');
  };

  const handlePressIn = () => {
    Animated.spring(pulse, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pulse, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <View className="mx-6 mb-4">
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          className="bg-surface rounded-2xl p-5 border border-white/8 active:border-white/20"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-lg bg-white/6 border border-white/12 items-center justify-center">
              <Text className="text-text-muted text-xl font-semibold">SOS</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary text-lg font-semibold">
                I need help
              </Text>
              <Text className="text-text-secondary text-sm mt-0.5">
                Connect with AI or a mentor immediately
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
