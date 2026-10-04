import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { PinPad } from '@/components/lock/PinPad';
import { headingShadow } from '@/styles';
import { useLockStore } from '@/store/lockStore';
import { setPin, verifyPin, clearPin } from '@/lib/appLock';

type Step = 'menu' | 'verifyCurrent' | 'enterNew' | 'confirmNew';
type Intent = 'setup' | 'change' | 'off';

export default function AppLockScreen() {
  const router = useRouter();
  const { hasPin, setHasPin } = useLockStore();

  const [intent, setIntent] = useState<Intent>(hasPin ? 'change' : 'setup');
  const [step, setStep] = useState<Step>(hasPin ? 'menu' : 'enterNew');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [reset, setReset] = useState(0);

  const bump = () => setReset((r) => r + 1);

  const start = (next: Intent) => {
    setIntent(next);
    setError('');
    setFirstPin('');
    bump();
    setStep(next === 'off' || next === 'change' ? 'verifyCurrent' : 'enterNew');
  };

  const onVerifyCurrent = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (!ok) {
      setError('Wrong PIN. Try again.');
      bump();
      return;
    }
    setError('');
    if (intent === 'off') {
      await clearPin();
      setHasPin(false);
      Alert.alert('App lock turned off', 'Your app will no longer ask for a PIN.');
      router.back();
      return;
    }
    // change → set a new one
    bump();
    setStep('enterNew');
  };

  const onEnterNew = (pin: string) => {
    setFirstPin(pin);
    setError('');
    bump();
    setStep('confirmNew');
  };

  const onConfirmNew = async (pin: string) => {
    if (pin !== firstPin) {
      setError('Those didn’t match. Let’s try again.');
      setFirstPin('');
      bump();
      setStep('enterNew');
      return;
    }
    await setPin(pin);
    setHasPin(true);
    Alert.alert(
      'App lock on',
      'Alchono will ask for this PIN when you open it. Forgot it? You can always sign out from the lock screen and set a new one.',
    );
    router.back();
  };

  return (
    <SafeArea>
      <ScreenHeader title="App lock" />

      <View className="flex-1 px-6">
        {step === 'menu' ? (
          <View className="flex-1 justify-center gap-5">
            <View className="items-center mb-2">
              <Text
                className="text-text-primary text-2xl font-semibold tracking-tight"
                style={headingShadow}
              >
                App lock is on
              </Text>
              <Text className="text-text-secondary text-base mt-2 text-center leading-relaxed">
                A PIN is asked for every time you open Alchono, so a picked-up
                phone can’t get into your journal.
              </Text>
            </View>
            <Button title="Change PIN" variant="secondary" size="lg" fullWidth onPress={() => start('change')} />
            <Button title="Turn off app lock" variant="danger" size="lg" fullWidth onPress={() => start('off')} />
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <View className="items-center mb-8">
              <Text
                className="text-text-primary text-2xl font-semibold tracking-tight"
                style={headingShadow}
              >
                {step === 'verifyCurrent'
                  ? 'Enter your current PIN'
                  : step === 'enterNew'
                    ? 'Choose a 4-digit PIN'
                    : 'Re-enter your new PIN'}
              </Text>
              {step === 'enterNew' ? (
                <Text className="text-text-secondary text-base mt-2 text-center leading-relaxed">
                  Pick something you’ll remember. You can change it any time.
                </Text>
              ) : null}
            </View>

            <PinPad
              pinLength={4}
              resetKey={`${step}-${reset}`}
              error={error}
              onComplete={
                step === 'verifyCurrent'
                  ? onVerifyCurrent
                  : step === 'enterNew'
                    ? onEnterNew
                    : onConfirmNew
              }
            />
          </View>
        )}
      </View>
    </SafeArea>
  );
}
