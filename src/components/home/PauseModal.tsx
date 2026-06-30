import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated as RNAnimated } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/store/appStore';
import { useActiveSession, useIncrementPause } from '@/hooks/useDrinkingSession';
import { PAUSE_ACTIONS } from '@/types';

const PAUSE_SECONDS = 60;

export function PauseModal() {
  const { pauseModalVisible, setPauseModalVisible } = useAppStore();
  const { data: activeSession } = useActiveSession();
  const { mutate: incrementPause } = useIncrementPause();
  const [phase, setPhase] = useState<'countdown' | 'action'>('countdown');
  const [seconds, setSeconds] = useState(PAUSE_SECONDS);
  const progress = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!pauseModalVisible) {
      setPhase('countdown');
      setSeconds(PAUSE_SECONDS);
      progress.setValue(0);
      return;
    }

    if (activeSession) {
      incrementPause({
        sessionId: activeSession.id,
        currentCount: activeSession.paused_count,
      });
    }

    RNAnimated.timing(progress, {
      toValue: 1,
      duration: PAUSE_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    let remaining = PAUSE_SECONDS;
    const interval = setInterval(() => {
      remaining -= 1;
      setSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setPhase('action');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      progress.stopAnimation();
    };
  }, [pauseModalVisible]);

  const handleClose = () => setPauseModalVisible(false);

  return (
    <Modal
      visible={pauseModalVisible}
      onClose={handleClose}
      title={phase === 'countdown' ? 'Take a breath' : 'What would you like to do?'}
    >
      {phase === 'countdown' ? (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text className="text-text-secondary text-sm mb-6 leading-relaxed">
            Just 60 seconds. Notice how you feel right now.
          </Text>
          <View className="items-center py-6">
            <Text className="text-8xl font-bold text-text-primary tabular-nums">
              {seconds}
            </Text>
            <Text className="text-text-secondary text-sm mt-2">seconds</Text>
          </View>
          <View className="h-1 bg-surface-2 rounded-full mb-6 overflow-hidden">
            <RNAnimated.View
              className="h-1 bg-accent rounded-full"
              style={{
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
          <Pressable onPress={handleClose} className="items-center py-2">
            <Text className="text-text-muted text-sm">Skip</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text className="text-text-secondary text-sm mb-4 leading-relaxed">
            Choose one thing. No pressure either way.
          </Text>
          <View className="gap-2 mb-4">
            {PAUSE_ACTIONS.map((action) => (
              <Pressable
                key={action.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleClose();
                }}
                className="flex-row items-center gap-3 bg-surface-2 rounded-xl px-4 py-3.5 border border-white/5 active:bg-white/5"
              >
                <Text className="text-xl">{action.icon}</Text>
                <Text className="text-text-primary font-medium text-sm flex-1">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}
    </Modal>
  );
}
