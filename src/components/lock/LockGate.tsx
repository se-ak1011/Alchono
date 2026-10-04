import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, AppState, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SoulIcon } from '@/components/icons/SoulIcon';
import { headingShadow } from '@/styles';
import { PinPad } from '@/components/lock/PinPad';
import { useLockStore } from '@/store/lockStore';
import { useAuthStore } from '@/store/authStore';
import { isPinSet, verifyPin, clearPin } from '@/lib/appLock';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';
import { queryClient } from '@/lib/queryClient';

/**
 * Full-screen PIN gate. Mounted once at the root, above navigation. It locks
 * the app on cold launch and whenever the app is sent to the background, so a
 * picked-up phone can't open the journal. Only active when a PIN is set AND the
 * user is signed in (there's nothing private to guard on the login screen).
 */
export function LockGate() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { hasPin, isLocked, setHasPin, setChecked, lock, unlock } = useLockStore();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // On launch: find out if a PIN exists, and if so, start locked.
  useEffect(() => {
    let active = true;
    isPinSet()
      .then((exists) => {
        if (!active) return;
        setHasPin(exists);
        if (exists) lock();
      })
      .finally(() => active && setChecked(true));
    return () => {
      active = false;
    };
  }, []);

  // Re-lock when the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' && useLockStore.getState().hasPin) {
        lock();
      }
    });
    return () => sub.remove();
  }, []);

  const handleComplete = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (ok) {
      setError('');
      unlock();
    } else {
      setError('Wrong PIN. Try again.');
      setAttempt((a) => a + 1);
    }
  };

  const handleForgot = () => {
    Alert.alert(
      'Forgot your PIN?',
      "We'll turn off the app lock and sign you out. Sign back in with the code we email you, and you can set a new PIN any time.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn off & sign out',
          style: 'destructive',
          onPress: async () => {
            await clearPin();
            setHasPin(false);
            unlock();
            await supabase.auth.signOut().catch(() => {});
            queryClient.clear();
            useAppStore.getState().reset();
            useAuthStore.getState().reset();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  // Nothing to guard unless a PIN is set, the app is locked, and someone's in.
  if (!hasPin || !isLocked || !session) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: '#201D28', paddingTop: insets.top, paddingBottom: insets.bottom, zIndex: 100, elevation: 100 },
      ]}
    >
      <View className="flex-1 px-6 justify-center items-center">
        <SoulIcon size={56} />
        <Text
          className="text-text-primary text-3xl font-semibold tracking-tight mt-4 mb-1"
          style={headingShadow}
        >
          Welcome back
        </Text>
        <Text className="text-text-secondary text-lg mb-8 text-center">
          Enter your PIN to open Alchono.
        </Text>

        <PinPad pinLength={4} onComplete={handleComplete} resetKey={attempt} error={error} />

        <Pressable onPress={handleForgot} className="mt-10 py-2" hitSlop={8}>
          <Text className="text-text-muted text-base">Forgot your PIN?</Text>
        </Pressable>
      </View>
    </View>
  );
}
