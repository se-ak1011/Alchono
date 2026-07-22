import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { headingShadow } from '@/styles';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  registerForPushNotifications,
  savePushToken,
} from '@/lib/notifications';
import {
  CircleStep,
  ReasonsStep,
  DrinkingStep,
  DEFAULT_PREFERENCES,
  nameInputStyle,
} from '@/components/preferences/PreferenceSections';
import { CompanionCarousel } from '@/components/companion/CompanionCarousel';
import type { UserPreferences } from '@/types';

// Trust first, information second. Two things are asked for (a name, a
// companion); everything after is optional and clearly skippable.
const STEPS = [
  {
    id: 'username',
    title: 'What should we call you?',
    body: "Pick a username — it's the only name others ever see. Nothing else to fill in here.",
  },
  {
    id: 'companion',
    title: "Who's walking with you?",
    body: 'A mate who’s just there with you, on the good days and the hard ones. You can change them any time.',
  },
  {
    id: 'reasons',
    title: 'What brings you here?',
    body: 'Choose whatever fits — more than one is fine. It just helps me understand where you’re coming from.',
  },
  {
    id: 'drinking',
    title: 'Would it help if I understood your drinking a little better?',
    body: 'Completely optional, and never judged. Rough answers are perfect — this only helps me suggest the right things.',
    optional: true,
  },
  {
    id: 'people',
    title: 'Who matters to you?',
    body: 'First names are enough. On a hard night, I can bring them to mind. Skip anything you’d rather not share.',
    optional: true,
    isLast: true,
  },
] as const;

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { user, profile, setProfile } = useAuthStore();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences>({
    ...DEFAULT_PREFERENCES,
    ...((profile?.preferences as Partial<UserPreferences>) ?? {}),
  });
  const [saving, setSaving] = useState(false);

  const currentStep = STEPS[step];

  const updatePrefs = (partial: Partial<UserPreferences>) =>
    setPrefs((p) => ({ ...p, ...partial }));

  // Persist the chosen username. Returns true on success; surfaces a friendly
  // error (and returns false) if it's taken or malformed, so we don't advance.
  const saveUsername = async (): Promise<boolean> => {
    const name = username.trim();
    if (name.length < 2) {
      setUsernameError('At least 2 characters');
      return false;
    }
    if (name.length > 30) {
      setUsernameError('Max 30 characters');
      return false;
    }
    if (!USERNAME_RE.test(name)) {
      setUsernameError('Letters, numbers and underscores only');
      return false;
    }
    if (!user) {
      Alert.alert('Session expired', 'Please sign in again.');
      return false;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ username: name })
      .eq('id', user.id);
    if (error) {
      // 23505 = unique violation → username already taken.
      setUsernameError(
        error.code === '23505'
          ? 'That username is taken — try another'
          : 'Could not save that — try again',
      );
      return false;
    }
    setUsernameError(null);
    if (profile) setProfile({ ...profile, username: name });
    return true;
  };

  const stepSavePrefs = () => {
    if (!user) return;
    supabase
      .from('profiles')
      .update({ preferences: prefs as any })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.warn('[onboarding] prefs step-save failed:', error.message);
      });
  };

  const finish = async () => {
    if (!user) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }
    setSaving(true);
    const { data: updatedRows, error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true, preferences: prefs as any })
      .eq('id', user.id)
      .select();

    let saved = updatedRows?.[0] ?? null;

    if (!error && !saved) {
      // Profile row missing (e.g. deleted during testing) — recreate it.
      const { data: upserted } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            onboarding_completed: true,
            preferences: prefs as any,
            ...(username.trim() ? { username: username.trim() } : {}),
          },
          { onConflict: 'id' },
        )
        .select();
      saved = upserted?.[0] ?? null;
    }

    setProfile(
      saved
        ? { ...saved, preferences: prefs as any }
        : { ...profile!, onboarding_completed: true, preferences: prefs as any },
    );

    registerForPushNotifications()
      .then((token) => { if (token && user) return savePushToken(user.id, token); })
      .catch(() => {});

    setSaving(false);
    router.replace('/(tabs)');
  };

  const goNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep.id === 'username') {
      const ok = await saveUsername();
      if (!ok) return;
    }
    if ((currentStep as any).isLast) {
      await finish();
      return;
    }
    stepSavePrefs();
    setStep((s) => s + 1);
  };

  const skip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if ((currentStep as any).isLast) {
      await finish();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#201D28' }}
    >
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
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
            <Text
              className="text-text-primary text-3xl font-semibold tracking-tight mb-2 leading-tight"
              style={headingShadow}
            >
              {currentStep.title}
            </Text>
            <Text className="text-text-secondary text-base leading-relaxed mb-6">
              {currentStep.body}
            </Text>

            {currentStep.id === 'username' && (
              <View>
                <TextInput
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    if (usernameError) setUsernameError(null);
                  }}
                  placeholder="Choose a username"
                  placeholderTextColor="#817B91"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                  style={nameInputStyle}
                />
                {usernameError ? (
                  <Text className="text-danger text-sm mt-2">{usernameError}</Text>
                ) : (
                  <Text className="text-text-muted text-xs mt-2 leading-relaxed">
                    This is your only public identifier.
                  </Text>
                )}
              </View>
            )}
            {currentStep.id === 'companion' && (
              <CompanionCarousel
                value={prefs.companionId}
                onChange={(id) => updatePrefs({ companionId: id })}
              />
            )}
            {currentStep.id === 'reasons' && (
              <ReasonsStep prefs={prefs} onChange={updatePrefs} />
            )}
            {currentStep.id === 'drinking' && (
              <DrinkingStep prefs={prefs} onChange={updatePrefs} />
            )}
            {currentStep.id === 'people' && (
              <CircleStep prefs={prefs} onChange={updatePrefs} />
            )}
          </Animated.View>
        </ScrollView>

        <View className="px-6 mt-4">
          <Button
            title={(currentStep as any).isLast ? "Let's go" : 'Continue'}
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            onPress={goNext}
          />
          {(currentStep as any).optional && (
            <Pressable onPress={skip} className="items-center py-3 mt-1" hitSlop={8}>
              <Text className="text-text-muted text-base font-medium">
                {(currentStep as any).isLast ? 'Skip for now' : 'Skip'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
