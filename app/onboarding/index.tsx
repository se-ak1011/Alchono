import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SoulIcon } from '@/components/icons/SoulIcon';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  registerForPushNotifications,
  savePushToken,
} from '@/lib/notifications';
import type { UserPreferences } from '@/types';

const STEPS = [
  {
    id: 'welcome',
    title: "This is your space.",
    body: "Alchono exists to help you understand yourself — not to judge you. Everything here stays private.",
    mask: true,
  },
  {
    id: 'how',
    title: "How it works.",
    body: "A daily check-in takes under ten seconds. When you notice you're drinking, log it. Alchono tracks the patterns so you don't have to.",
    emoji: '✍️',
  },
  {
    id: 'support',
    title: "You're not alone.",
    body: "AI support is available any time. Anonymous community. Verified mentors who've been where you are.",
    emoji: '🤝',
  },
  {
    id: 'circle',
    title: "Your circle.",
    body: "Helps us personalise your support. Skip anything you'd rather not share.",
    emoji: '❤️',
    custom: true,
  },
  {
    id: 'rhythm',
    title: "Your daily rhythm.",
    body: "We'll avoid interrupting you at the wrong moments.",
    emoji: '⏰',
    custom: true,
  },
  {
    id: 'notifications',
    title: "Gentle reminders.",
    body: "Alchono will check in once a day. Nothing pushy. You control what you receive.",
    emoji: '🔔',
    isLast: true,
  },
] as const;

const FAMILY_OPTIONS = [
  { key: 'partner', label: 'Partner', emoji: '👫' },
  { key: 'children', label: 'Children', emoji: '👶' },
  { key: 'parents', label: 'Parents (I live with them)', emoji: '🏠' },
] as const;

const SHIFT_OPTIONS = [
  { key: 'morning', label: 'Morning' },
  { key: 'day', label: 'Daytime' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
] as const;

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center justify-between bg-surface rounded-xl px-4 py-3.5 border border-white/8"
    >
      <Text className="text-text-primary text-sm font-medium flex-1 pr-4">{label}</Text>
      <View
        style={{
          width: 46,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? '#B77A33' : '#242729',
          justifyContent: 'center',
          alignItems: value ? 'flex-end' : 'flex-start',
          paddingHorizontal: 3,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#F6F5F2',
          }}
        />
      </View>
    </Pressable>
  );
}

function CircleStep({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: Partial<UserPreferences>) => void;
}) {
  const toggleFamily = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = prefs.familyMembers;
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    onChange({ familyMembers: next });
  };

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          Family
        </Text>
        <View style={{ gap: 8 }}>
          {FAMILY_OPTIONS.map(({ key, label, emoji }) => {
            const selected = prefs.familyMembers.includes(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggleFamily(key)}
                className={`flex-row items-center gap-3 rounded-xl px-4 py-3 border ${
                  selected
                    ? 'bg-accent/15 border-accent/40'
                    : 'bg-surface border-white/8'
                }`}
              >
                <Text className="text-xl">{emoji}</Text>
                <Text
                  className={`text-sm font-medium ${
                    selected ? 'text-accent' : 'text-text-primary'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          Pets
        </Text>
        <ToggleRow
          label="I have a pet"
          value={prefs.hasPets}
          onToggle={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange({ hasPets: !prefs.hasPets, petName: '' });
          }}
        />
        {prefs.hasPets && (
          <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 8 }}>
            <TextInput
              value={prefs.petName}
              onChangeText={(t) => onChange({ petName: t })}
              placeholder="What's their name?"
              placeholderTextColor="#5E6472"
              style={{
                backgroundColor: '#1D2023',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#F6F5F2',
                fontSize: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function RhythmStep({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: Partial<UserPreferences>) => void;
}) {
  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          Work
        </Text>
        <View style={{ gap: 8 }}>
          <ToggleRow
            label="I have a job"
            value={prefs.hasJob}
            onToggle={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange({ hasJob: !prefs.hasJob, workShift: null, drinksAtWork: false });
            }}
          />
          {prefs.hasJob && (
            <Animated.View entering={FadeIn.duration(300)} style={{ gap: 8 }}>
              <View className="flex-row flex-wrap gap-2">
                {SHIFT_OPTIONS.map(({ key, label }) => {
                  const selected = prefs.workShift === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onChange({ workShift: selected ? null : key });
                      }}
                      className={`px-4 py-2 rounded-xl border ${
                        selected
                          ? 'bg-accent/15 border-accent/40'
                          : 'bg-surface border-white/8'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected ? 'text-accent' : 'text-text-primary'
                        }`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <ToggleRow
                label="I sometimes drink during work"
                value={prefs.drinksAtWork}
                onToggle={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChange({ drinksAtWork: !prefs.drinksAtWork });
                }}
              />
            </Animated.View>
          )}
        </View>
      </View>

      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          Location
        </Text>
        <TextInput
          value={prefs.city}
          onChangeText={(t) => onChange({ city: t })}
          placeholder="City or area (optional — for local resources)"
          placeholderTextColor="#5E6472"
          style={{
            backgroundColor: '#1D2023',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#F6F5F2',
            fontSize: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { user, profile, setProfile } = useAuthStore();
  const [prefs, setPrefs] = useState<UserPreferences>({
    familyMembers: [],
    hasPets: false,
    petName: '',
    hasJob: false,
    workShift: null,
    drinksAtWork: false,
    city: '',
  });

  const currentStep = STEPS[step];

  const updatePrefs = (partial: Partial<UserPreferences>) =>
    setPrefs((p) => ({ ...p, ...partial }));

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if ((currentStep as any).isLast) {
      setProfile({ ...profile!, onboarding_completed: true });

      supabase
        .from('profiles')
        .update({ onboarding_completed: true, preferences: prefs as any })
        .eq('id', user!.id)
        .then(() => {})
        .catch(() => {});

      registerForPushNotifications()
        .then((token) => { if (token && user) return savePushToken(user.id, token); })
        .catch(() => {});
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#151718' }}
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
            {(currentStep as any).mask ? (
              <View className="items-center mb-8">
                <SoulIcon size={80} gradient />
              </View>
            ) : (
              <Text className="text-6xl mb-8 text-center">{(currentStep as any).emoji}</Text>
            )}

            <Text className="text-text-primary text-3xl font-bold tracking-tight mb-4 leading-tight">
              {currentStep.title}
            </Text>
            <Text className="text-text-secondary text-base leading-relaxed mb-6">
              {currentStep.body}
            </Text>

            {currentStep.id === 'circle' && (
              <CircleStep prefs={prefs} onChange={updatePrefs} />
            )}
            {currentStep.id === 'rhythm' && (
              <RhythmStep prefs={prefs} onChange={updatePrefs} />
            )}
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
              onPress={() => setStep(STEPS.length - 1)}
              className="items-center py-2"
            >
              <Text className="text-text-muted text-sm">Skip intro</Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
