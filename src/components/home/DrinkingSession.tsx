import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useActiveSession,
  useStartSession,
  useEndSession,
} from '@/hooks/useDrinkingSession';
import { useAppStore } from '@/store/appStore';

function formatDuration(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function DrinkingSession() {
  const { data: activeSession } = useActiveSession();
  const { mutate: startSession, isPending: isStarting } = useStartSession();
  const { mutate: endSession, isPending: isEnding } = useEndSession();
  const { setPauseModalVisible, alcoholFreeTodayDate, setAlcoholFreeToday, clearAlcoholFreeToday } = useAppStore();
  const router = useRouter();
  const [duration, setDuration] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const alcoholFreeMarked = alcoholFreeTodayDate === today;

  useEffect(() => {
    if (!activeSession) return;
    setDuration(formatDuration(activeSession.started_at));
    const interval = setInterval(() => {
      setDuration(formatDuration(activeSession.started_at));
    }, 60_000);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession) return;
    const ms = Date.now() - new Date(activeSession.started_at).getTime();
    const oneHour = 60 * 60 * 1000;
    if (ms >= oneHour) {
      setShowQuestion(true);
    } else {
      const remaining = oneHour - ms;
      const timer = setTimeout(() => setShowQuestion(true), remaining);
      return () => clearTimeout(timer);
    }
  }, [activeSession]);

  if (activeSession) {
    return (
      <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-4 gap-3">
        <Card className="border border-white/10">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase">
                Session active
              </Text>
              <Text className="text-text-primary text-2xl font-semibold mt-1">
                {duration}
              </Text>
            </View>
            <View className="w-2 h-2 rounded-full bg-white/60" />
          </View>

          {showQuestion && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              className="bg-surface-2 rounded-xl p-4 mb-3 border border-white/5"
            >
              <Text className="text-text-primary text-base font-medium mb-3">
                Still going?
              </Text>
              <View className="flex-row gap-2">
                <Button
                  title="Yes"
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onPress={() => setShowQuestion(false)}
                />
                <Button
                  title="No, I'm done"
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    endSession(activeSession.id);
                  }}
                />
              </View>
            </Animated.View>
          )}

          <View className="flex-row gap-2">
            <Button
              title="Pause"
              variant="secondary"
              size="sm"
              className="flex-1"
              onPress={() => setPauseModalVisible(true)}
            />
            <Button
              title="End session"
              variant="ghost"
              size="sm"
              className="flex-1"
              loading={isEnding}
              onPress={() => {
                Alert.alert(
                  'End session?',
                  'That takes awareness.',
                  [
                    { text: 'Keep going', style: 'cancel' },
                    {
                      text: 'End it',
                      onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        endSession(activeSession.id);
                      },
                    },
                  ],
                );
              }}
            />
          </View>
        </Card>

        <Button
          title="I need support"
          variant="secondary"
          size="md"
          fullWidth
          onPress={() => router.push('/support/sos')}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-4">
      <Card>
        <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-4">
          Today
        </Text>

        <View className="gap-2">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (alcoholFreeMarked) {
                clearAlcoholFreeToday();
              } else {
                setAlcoholFreeToday();
              }
            }}
            className={`flex-row items-center gap-4 rounded-xl px-4 py-4 border ${
              alcoholFreeMarked
                ? 'bg-surface border-white/25'
                : 'bg-surface border-white/8 active:border-white/20'
            }`}
          >
            <Text className="text-text-muted text-sm w-3">{alcoholFreeMarked ? '◆' : '○'}</Text>
            <Text className="text-text-primary text-base font-medium">
              Alcohol-free today
            </Text>
            {alcoholFreeMarked && (
              <Text className="text-text-muted text-sm ml-auto">tap to undo</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/session/urge');
            }}
            className="flex-row items-center gap-4 bg-surface rounded-xl px-4 py-4 border border-white/8 active:border-white/20"
          >
            <Text className="text-text-muted text-sm w-3">≈</Text>
            <Text className="text-text-primary text-base font-medium">
              Feeling the urge
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              startSession();
            }}
            className="flex-row items-center gap-4 bg-surface rounded-xl px-4 py-4 border border-white/15 active:border-white/30"
          >
            {isStarting
              ? <Text className="text-text-muted text-base">Starting…</Text>
              : <>
                  <Text className="text-text-secondary text-sm w-3">●</Text>
                  <Text className="text-text-primary text-base font-medium">
                    Already drinking
                  </Text>
                </>
            }
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
}
