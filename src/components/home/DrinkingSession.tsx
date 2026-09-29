import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import {
  useActiveSession,
  useStartSession,
  useEndSession,
  useLogDrink,
} from '@/hooks/useDrinkingSession';
import { useLogDrinkEntry } from '@/hooks/useDrinkEntries';
import { useAfToday, useToggleAlcoholFree } from '@/hooks/useVictories';
import { useAppStore } from '@/store/appStore';
import { DrinkPicker } from '@/components/session/DrinkPicker';

// Ink tones for the resting state, which now sits on the Tonight notebook page.
const INK = '#332a24';
const INK_SOFT = 'rgba(51,42,36,0.55)';

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
  const { mutate: logDrink, isPending: isLogging } = useLogDrink();
  const { mutate: logDrinkEntry } = useLogDrinkEntry();
  const { setPauseModalVisible } = useAppStore();
  const { data: alcoholFreeMarked = false } = useAfToday();
  const { mutate: toggleAlcoholFree } = useToggleAlcoholFree();
  const router = useRouter();
  const [duration, setDuration] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

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
            <View className="items-end">
              <Text className="text-text-primary text-2xl font-semibold">
                {(activeSession as any).drinks_count ?? 0}
              </Text>
              <Text className="text-text-muted text-xs tracking-widest uppercase">
                {((activeSession as any).drinks_count ?? 0) === 1 ? 'drink' : 'drinks'}
              </Text>
            </View>
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

          {/* Log a drink — pick what it was so units are counted (GP diary). */}
          <Button
            title="Add drink"
            variant="secondary"
            size="sm"
            fullWidth
            loading={isLogging}
            className="mb-2"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPickerOpen(true);
            }}
          />

          <DrinkPicker
            visible={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={(preset) => {
              setPickerOpen(false);
              // Keep the live counter, and record the units for the diary.
              logDrink({});
              logDrinkEntry({
                drinkType: preset.key,
                drinkLabel: preset.label,
                units: preset.units,
                sessionId: activeSession.id,
              });
            }}
          />

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

  // Resting state — written on the notebook page (Tonight). Ink rows, not
  // dark cards, so it belongs with A note / Your notes / Recovery.
  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ marginHorizontal: 30, marginTop: 10 }}>
      <Text style={{ fontFamily: 'PatrickHand', fontSize: 15, color: INK_SOFT, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        Today
      </Text>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleAlcoholFree(!alcoholFreeMarked);
        }}
        className="active:opacity-70"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(51,42,36,0.14)' }}
      >
        <Feather name={alcoholFreeMarked ? 'check-circle' : 'circle'} size={21} color={alcoholFreeMarked ? '#5a8a4e' : INK_SOFT} />
        <Text style={{ fontFamily: 'PatrickHand', fontSize: 20, color: INK, flex: 1 }}>Alcohol-free today</Text>
        {alcoholFreeMarked && <Text style={{ color: INK_SOFT, fontSize: 12.5 }}>tap to undo</Text>}
      </Pressable>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/session/urge');
        }}
        className="active:opacity-70"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(51,42,36,0.14)' }}
      >
        <Feather name="anchor" size={20} color="#7b5fc0" />
        <Text style={{ fontFamily: 'PatrickHand', fontSize: 20, color: INK, flex: 1 }}>I want a drink</Text>
        <Feather name="chevron-right" size={16} color={INK_SOFT} />
      </Pressable>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          startSession();
        }}
        className="active:opacity-70"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(51,42,36,0.14)' }}
      >
        <Feather name="clock" size={20} color={INK_SOFT} />
        <Text style={{ fontFamily: 'PatrickHand', fontSize: 20, color: INK, flex: 1 }}>
          {isStarting ? 'Starting…' : 'Already drinking'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
