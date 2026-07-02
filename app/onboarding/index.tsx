import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SoulIcon } from '@/components/icons/SoulIcon';
import { Button } from '@/components/ui/Button';
import { headingShadow } from '@/styles';
import * as Location from 'expo-location';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  registerForPushNotifications,
  savePushToken,
} from '@/lib/notifications';
import {
  CircleStep,
  RhythmStep,
  DEFAULT_PREFERENCES,
} from '@/components/preferences/PreferenceSections';
import type { UserPreferences } from '@/types';

const WELCOME_BULLETS = [
  'Check in in under 10 seconds.',
  'Spot drinking patterns automatically.',
  'AI support whenever you need it.',
  'Anonymous community if you want it.',
  'No lectures. No judgement.',
];

const STEPS = [
  {
    id: 'welcome',
    title: "This is your space.",
    subtitle: "Private. Compassionate. Yours.",
    mask: true,
  },
  {
    id: 'circle',
    title: "People at home.",
    body: "So we know what's at stake. You don't have to fill this in.",
    custom: true,
  },
  {
    id: 'rhythm',
    title: "Your hours.",
    body: "So we don't ping you in the middle of a shift.",
    custom: true,
    isLast: true,
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { user, profile, setProfile } = useAuthStore();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);

  const captureLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'No worries',
          'You can turn this on later — the feed just won’t be sorted by distance.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      // Round to 1 decimal (~11km) BEFORE it ever leaves the device.
      setLatLng({
        lat: Math.round(pos.coords.latitude * 10) / 10,
        lng: Math.round(pos.coords.longitude * 10) / 10,
      });
    } catch {
      Alert.alert('Could not get location', 'You can try again later from your profile.');
    }
  };

  const currentStep = STEPS[step];

  const updatePrefs = (partial: Partial<UserPreferences>) =>
    setPrefs((p) => ({ ...p, ...partial }));

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!user) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    if ((currentStep as any).isLast) {
      // update().select() (no .single()) so zero matched rows is detectable
      // instead of surfacing as a coercion error.
      const { data: updatedRows, error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          preferences: prefs as any,
          ...(latLng ? { location_lat: latLng.lat, location_lng: latLng.lng } : {}),
        })
        .eq('id', user.id)
        .select();

      let saved = updatedRows?.[0] ?? null;

      if (!error && !saved) {
        // Profile row is missing (e.g. deleted during testing while the auth
        // user survived). Recreate it — profiles_insert_own RLS allows this.
        const { data: upserted, error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            { id: user.id, onboarding_completed: true, preferences: prefs as any },
            { onConflict: 'id' },
          )
          .select();
        saved = upserted?.[0] ?? null;
        if (upsertError) {
          Alert.alert(
            'Preferences not saved',
            `Your answers couldn't be stored:\n\n${upsertError.message}`,
          );
        }
      } else if (error) {
        Alert.alert(
          'Preferences not saved',
          `Your answers couldn't be stored:\n\n${error.message}`,
        );
      }

      // Local state always carries the preferences the user just entered,
      // regardless of what the DB round-trip returned.
      setProfile(
        saved
          ? { ...saved, preferences: prefs as any }
          : { ...profile!, onboarding_completed: true, preferences: prefs as any }
      );

      registerForPushNotifications()
        .then((token) => { if (token && user) return savePushToken(user.id, token); })
        .catch(() => {});

      router.replace('/(tabs)');
    } else {
      // Commit preferences at every step transition so nothing typed on this
      // step (partner/children names) can be lost before the final save.
      supabase
        .from('profiles')
        .update({ preferences: prefs as any })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.warn('[onboarding] prefs step-save failed:', error.message);
        });
      setStep((s) => s + 1);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0E0F10' }}
    >
      <View
        style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        {/* Progress dots */}
        <View className="flex-row gap-1.5 px-6 pt-4 mb-8">
          {STEPS.map((_, i) => (
            <View
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? 'bg-accent' : 'bg-surface-2'
              }`}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            key={currentStep.id}
            entering={FadeInDown.duration(400).springify()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {(currentStep as any).mask && (
              <View className="items-center mb-10">
                <SoulIcon size={72} />
              </View>
            )}

            <Text className="text-text-primary text-3xl font-semibold tracking-tight mb-2 leading-tight" style={headingShadow}>
              {currentStep.title}
            </Text>

            {(currentStep as any).subtitle && (
              <Text className="text-text-secondary text-base mb-6">
                {(currentStep as any).subtitle}
              </Text>
            )}

            {currentStep.id === 'welcome' && (
              <View style={{ gap: 14, marginTop: 8 }}>
                {WELCOME_BULLETS.map((bullet) => (
                  <View key={bullet} className="flex-row items-start gap-3">
                    <Text className="text-text-muted text-sm mt-0.5">—</Text>
                    <Text className="text-text-secondary text-base flex-1 leading-relaxed">
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {(currentStep as any).body && (
              <Text className="text-text-secondary text-base leading-relaxed mb-6">
                {(currentStep as any).body}
              </Text>
            )}

            {currentStep.id === 'circle' && (
              <CircleStep prefs={prefs} onChange={updatePrefs} />
            )}
            {currentStep.id === 'rhythm' && (
              <RhythmStep
                prefs={prefs}
                onChange={updatePrefs}
                locationCaptured={!!latLng}
                onCaptureLocation={captureLocation}
              />
            )}
          </Animated.View>
        </ScrollView>

        <View className="px-6 mt-4">
          <Button
            title={(currentStep as any).isLast ? "Let's go" : 'Continue'}
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleNext}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
