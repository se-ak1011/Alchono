import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MaskIcon } from '@/components/icons/MaskIcon';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  registerForPushNotifications,
  savePushToken,
} from '@/lib/notifications';

const STEPS = [
  {
    id: 'welcome',
    title: "This is your space.",
    body: "Alchono exists to help you understand yourself — not to judge you. Everything here stays private.",
    emoji: null,
    mask: true,
  },
  {
    id: 'how',
    title: "How it works.",
    body: "A daily check-in takes under ten seconds. When you notice you're drinking, log it. Alchono tracks the patterns so you don't have to.",
    emoji: '✍️',
    mask: false,
  },
  {
    id: 'support',
    title: "You're not alone.",
    body: "AI support is available any time. Anonymous community. Verified mentors who've been where you are.",
    emoji: '🤝',
    mask: false,
  },
  {
    id: 'notifications',
    title: "Gentle reminders.",
    body: "Alchono will check in once a day. Nothing pushy. You control what you receive.",
    emoji: '🔔',
    mask: false,
    isLast: true,
  },
] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { user, profile, setProfile } = useAuthStore();
  const currentStep = STEPS[step];

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if ((currentStep as any).isLast) {
      // Update the store first — AuthGate navigates to /(tabs) immediately
      setProfile({ ...profile!, onboarding_completed: true });

      // Persist to Supabase in background — not awaited
      supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user!.id)
        .then(() => {})
        .catch(() => {});

      // Push notification registration also in background
      registerForPushNotifications()
        .then((token) => { if (token && user) return savePushToken(user.id, token); })
        .catch(() => {});
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      {/* Progress */}
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
      >
        <Animated.View
          key={currentStep.id}
          entering={FadeInDown.duration(400).springify()}
          className="flex-1 justify-center"
        >
          {currentStep.mask ? (
            <View className="items-center mb-8">
              <MaskIcon size={72} gradient />
            </View>
          ) : (
            <Text className="text-6xl mb-8 text-center">{currentStep.emoji}</Text>
          )}

          <Text className="text-text-primary text-3xl font-bold tracking-tight mb-4 leading-tight">
            {currentStep.title}
          </Text>
          <Text className="text-text-secondary text-base leading-relaxed">
            {currentStep.body}
          </Text>
        </Animated.View>
      </ScrollView>

      <View className="px-6 gap-3 mt-4">
        <Button
          title={(currentStep as any).isLast ? "Let's go" : 'Continue'}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleNext}
        />
        {step < STEPS.length - 1 && (
          <Pressable
            onPress={() => {
              setStep(STEPS.length - 1);
            }}
            className="items-center py-2"
          >
            <Text className="text-text-muted text-sm">Skip intro</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
