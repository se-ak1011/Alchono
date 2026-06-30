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
  const { setPauseModalVisible, drinkingPromptDismissedDate, dismissDrinkingPrompt } = useAppStore();
  const router = useRouter();
  const [duration, setDuration] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);
  const [notSureAck, setNotSureAck] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const promptDismissed = drinkingPromptDismissedDate === today;

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
      <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3 gap-3">
        <Card className="border border-accent/20">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-text-secondary text-sm font-medium">
                Riding it out.
              </Text>
              <Text className="text-text-primary text-xl font-semibold mt-0.5">
                {duration}
              </Text>
            </View>
            <View className="w-2 h-2 rounded-full bg-accent" />
          </View>

          {showQuestion && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              className="bg-surface-2 rounded-xl p-3 mb-3 border border-white/5"
            >
              <Text className="text-text-primary text-sm font-medium mb-2">
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
                  variant="accent"
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
                  'That takes awareness. Well done.',
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
          variant="accent"
          size="md"
          fullWidth
          onPress={() => router.push('/support/sos')}
        />
      </Animated.View>
    );
  }

  if (promptDismissed) return null;

  const handleNotSure = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotSureAck(true);
    setTimeout(() => setNotSureAck(false), 2500);
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3">
      <Card>
        <Text className="text-text-primary text-base font-semibold mb-1">
          How's today looking?
        </Text>
        <Text className="text-text-secondary text-sm mb-4 leading-relaxed">
          Just this moment. No pressure.
        </Text>

        {notSureAck && (
          <Animated.View entering={FadeIn.duration(200)} className="mb-3">
            <Text className="text-text-muted text-sm text-center">
              Take it one moment at a time.
            </Text>
          </Animated.View>
        )}

        <View className="gap-2">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              dismissDrinkingPrompt();
            }}
            className="flex-row items-center gap-2 bg-surface-2 rounded-xl px-4 py-3 border border-white/8 active:bg-white/5"
          >
            <Text className="text-base">🟢</Text>
            <Text className="text-text-primary text-sm font-medium">
              Staying alcohol-free
            </Text>
          </Pressable>

          <Pressable
            onPress={handleNotSure}
            className="flex-row items-center gap-2 bg-surface-2 rounded-xl px-4 py-3 border border-white/8 active:bg-white/5"
          >
            <Text className="text-base">🟡</Text>
            <Text className="text-text-primary text-sm font-medium">
              Not sure yet
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              startSession();
            }}
            className="flex-row items-center gap-2 bg-accent/15 rounded-xl px-4 py-3 border border-accent/30 active:bg-accent/25"
          >
            {isStarting
              ? <Text className="text-text-muted text-sm">Starting…</Text>
              : <>
                  <Text className="text-base">🟠</Text>
                  <Text className="text-accent text-sm font-medium">
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
