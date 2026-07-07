import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { Button } from '@/components/ui/Button';
import { useAfToday, useToggleAlcoholFree } from '@/hooks/useVictories';
import { headingShadow } from '@/styles';

type ShortcutState = 'checking' | 'saving' | 'saved' | 'already' | 'error';

export default function RecordAlcoholFreeDayShortcutScreen() {
  const router = useRouter();
  const { data: alcoholFreeMarked = false, isLoading } = useAfToday();
  const { mutate: toggleAlcoholFree, isPending } = useToggleAlcoholFree();
  const [state, setState] = useState<ShortcutState>('checking');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (alcoholFreeMarked) {
      setState('already');
      return;
    }

    if (started || isPending) return;

    setStarted(true);
    setState('saving');
    toggleAlcoholFree(true, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setState('saved');
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setState('error');
      },
    });
  }, [alcoholFreeMarked, isLoading, isPending, started, toggleAlcoholFree]);

  const openHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  const openSky = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/constellation');
  };

  const retry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStarted(false);
    setState('checking');
  };

  const body =
    state === 'saved'
      ? 'Today is now recorded as alcohol-free.'
      : state === 'already'
        ? 'Today was already marked alcohol-free.'
        : state === 'error'
          ? 'We could not record today right now. Please try again in the app.'
          : 'Recording today as alcohol-free…';

  return (
    <SafeArea>
      <View className="flex-1 px-6 justify-center">
        <View className="bg-surface rounded-3xl border border-white/8 px-6 py-8">
          <Text
            className="text-text-primary text-3xl font-semibold tracking-tight"
            style={headingShadow}
          >
            Alcohol-free day
          </Text>
          <Text className="text-text-secondary text-base leading-relaxed mt-3">
            {body}
          </Text>

          {(state === 'checking' || state === 'saving') && (
            <View className="flex-row items-center gap-3 mt-6">
              <ActivityIndicator color="#F0F2F4" />
              <Text className="text-text-muted text-sm">
                Keep Alchono open for a moment.
              </Text>
            </View>
          )}

          <View className="mt-7 gap-3">
            {state === 'error' ? (
              <>
                <Button title="Try again" onPress={retry} fullWidth />
                <Button
                  title="Open Alchono"
                  variant="secondary"
                  onPress={openHome}
                  fullWidth
                />
              </>
            ) : (
              <>
                <Button title="Open Alchono" onPress={openHome} fullWidth />
                <Button
                  title="Open Your Sky"
                  variant="secondary"
                  onPress={openSky}
                  fullWidth
                />
              </>
            )}
          </View>
        </View>
      </View>
    </SafeArea>
  );
}
