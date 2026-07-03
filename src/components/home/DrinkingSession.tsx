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
import { useAfToday, useToggleAlcoholFree } from '@/hooks/useVictories';
import { useAppStore } from '@/store/appStore';

function formatDuration(startedAt: string): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Tiny harm-reduction nudges, rotating while a session is live.
// minMinutes gates the later ones so advice matches the moment.
const SESSION_NUDGES: { text: string; minMinutes: number }[] = [
  { text: 'Put your car keys somewhere hard to reach. Future you says thanks.', minMinutes: 0 },
  { text: 'Eat something if you haven’t. It slows everything down.', minMinutes: 0 },
  { text: 'Water between drinks. Oldest trick there is, still works.', minMinutes: 0 },
  { text: 'Make this next one a slow one.', minMinutes: 45 },
  { text: 'Another glass of water. Seriously.', minMinutes: 60 },
  { text: 'Pick your stopping point now, while it’s still your call.', minMinutes: 90 },
  { text: 'Phone in pocket, not in hand. No 2am texts you’ll regret.', minMinutes: 120 },
  { text: 'Water, food, and a charger by the bed. Tomorrow-you matters too.', minMinutes: 150 },
];

function currentNudge(startedAt: string): string {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
  const applicable = SESSION_NUDGES.filter((n) => n.minMinutes <= elapsed);
  // Rotate every 15 minutes through whatever applies right now.
  return applicable[Math.floor(elapsed / 15) % applicable.length].text;
}

export function DrinkingSession() {
  const { data: activeSession } = useActiveSession();
  const { mutate: startSession, isPending: isStarting } = useStartSession();
  const { mutate: endSession, isPending: isEnding } = useEndSession();
  const { setPauseModalVisible } = useAppStore();
  const { data: alcoholFreeMarked = false } = useAfToday();
  const { mutate: toggleAlcoholFree } = useToggleAlcoholFree();
  const router = useRouter();
  const [duration, setDuration] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);

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
        {/* Session active — pure black, no warmth. The dark side, plainly. */}
        <View
          className="rounded-2xl p-5 border border-white/10"
          style={{ backgroundColor: '#060708' }}
        >
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

          {/* Rotating harm-reduction nudge — changes as the session goes on */}
          <Animated.View
            key={currentNudge(activeSession.started_at)}
            entering={FadeIn.duration(600)}
            className="flex-row items-start gap-2 mb-3"
          >
            <Text className="text-text-muted text-sm">○</Text>
            <Text className="text-text-secondary text-sm leading-relaxed flex-1">
              {currentNudge(activeSession.started_at)}
            </Text>
          </Animated.View>

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
        </View>

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
              toggleAlcoholFree(!alcoholFreeMarked);
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
            className="flex-row items-center gap-4 bg-urge-surface rounded-xl px-4 py-4 border border-white/8 active:border-white/20"
            style={{
              shadowColor: '#120D17',
              shadowOpacity: 0.8,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            <Text className="text-text-muted text-sm w-3">≈</Text>
            <Text className="text-text-primary text-base font-medium">
              I want a drink
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              startSession();
            }}
            className="flex-row items-center gap-4 rounded-xl px-4 py-4 border border-white/8 active:border-white/20"
            style={{ backgroundColor: '#060708' }}
          >
            {isStarting
              ? <Text className="text-text-muted text-base">Starting…</Text>
              : <>
                  <Text className="text-text-muted text-sm w-3">○</Text>
                  <Text className="text-text-secondary text-base font-medium">
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
