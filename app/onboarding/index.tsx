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
import { useRouter } from 'expo-router';
import { SoulIcon } from '@/components/icons/SoulIcon';
import { Button } from '@/components/ui/Button';
import { headingShadow } from '@/styles';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  registerForPushNotifications,
  savePushToken,
} from '@/lib/notifications';
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

const FAMILY_OPTIONS = [
  { key: 'partner',  label: 'Partner' },
  { key: 'children', label: 'Children' },
  { key: 'parents',  label: 'Parents (I live with them)' },
] as const;

const SHIFT_OPTIONS = [
  { key: 'morning', label: 'Morning' },
  { key: 'day', label: 'Daytime' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
] as const;

const CHILDREN_COUNTS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4+' },
];

const PET_COUNTS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3+' },
];

function CountPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: number; label: string }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text className="text-text-muted text-sm mb-2">{label}</Text>
      <View className="flex-row gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(opt.value);
              }}
              style={{
                width: 52,
                height: 44,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? '#C4C9D0' : '#161718',
                borderWidth: 1,
                borderColor: selected ? '#C4C9D0' : 'rgba(255,255,255,0.08)',
              }}
            >
              <Text
                style={{
                  color: selected ? '#0E0F10' : '#9CA3AF',
                  fontSize: 15,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

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
          backgroundColor: value ? '#C4C9D0' : '#1E2022',
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

const nameInputStyle = {
  backgroundColor: '#161718',
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: '#F0F2F4',
  fontSize: 15,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
} as const;

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
          {FAMILY_OPTIONS.map(({ key, label }) => {
            const selected = prefs.familyMembers.includes(key);
            return (
              <View key={key}>
                <Pressable
                  onPress={() => toggleFamily(key)}
                  className={`flex-row items-center gap-3 rounded-lg px-4 py-3.5 border ${
                    selected
                      ? 'bg-surface border-white/25'
                      : 'bg-surface border-white/8'
                  }`}
                >
                  <Text className="text-text-muted text-xs w-3">{selected ? '◆' : '◇'}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      selected ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>

                {selected && key === 'partner' && (
                  <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 6 }}>
                    <TextInput
                      value={prefs.partnerName}
                      onChangeText={(t) => onChange({ partnerName: t })}
                      placeholder="Their name?"
                      placeholderTextColor="#5E6472"
                      style={nameInputStyle}
                    />
                  </Animated.View>
                )}

                {selected && key === 'children' && (
                  <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 6, gap: 8 }}>
                    <CountPicker
                      label="How many?"
                      options={CHILDREN_COUNTS}
                      value={prefs.childrenCount}
                      onChange={(v) => onChange({ childrenCount: v })}
                    />
                    <TextInput
                      value={prefs.childrenNames}
                      onChangeText={(t) => onChange({ childrenNames: t })}
                      placeholder={
                        prefs.childrenCount === 1
                          ? "Their name?"
                          : "Their names? (e.g. Emma, Jake)"
                      }
                      placeholderTextColor="#5E6472"
                      style={[nameInputStyle, { marginTop: 4 }]}
                    />
                  </Animated.View>
                )}
              </View>
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
            onChange({ hasPets: !prefs.hasPets, petName: '', petCount: 1 });
          }}
        />
        {prefs.hasPets && (
          <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 8, gap: 8 }}>
            <CountPicker
              label="How many?"
              options={PET_COUNTS}
              value={prefs.petCount}
              onChange={(v) => onChange({ petCount: v })}
            />
            <TextInput
              value={prefs.petName}
              onChangeText={(t) => onChange({ petName: t })}
              placeholder={
                prefs.petCount === 1 ? "What's their name?" : "What are their names?"
              }
              placeholderTextColor="#5E6472"
              style={[nameInputStyle, { borderRadius: 12, marginTop: 4 }]}
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
                      className={`px-4 py-2 rounded-lg border ${
                        selected
                          ? 'bg-surface border-white/25'
                          : 'bg-surface border-white/8'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected ? 'text-text-primary' : 'text-text-muted'
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
          style={nameInputStyle}
        />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { user, profile, setProfile } = useAuthStore();
  const [prefs, setPrefs] = useState<UserPreferences>({
    familyMembers: [],
    partnerName: '',
    childrenNames: '',
    childrenCount: 1,
    hasPets: false,
    petName: '',
    petCount: 1,
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
      // Save onboarding_completed first — this is the flag AuthGate checks.
      // Keeping it separate means a missing preferences column can never block it.
      const { data: updated } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user!.id)
        .select()
        .single();

      // Save preferences in the background — non-blocking.
      supabase
        .from('profiles')
        .update({ preferences: prefs as any })
        .eq('id', user!.id)
        .then(() => {})
        .catch(() => {});

      // Update local state immediately so AuthGate and the rest of the app
      // reflect preferences without waiting for a DB round-trip.
      setProfile(
        updated
          ? { ...updated, preferences: prefs as any }
          : { ...profile!, onboarding_completed: true, preferences: prefs as any }
      );

      registerForPushNotifications()
        .then((token) => { if (token && user) return savePushToken(user.id, token); })
        .catch(() => {});

      router.replace('/(tabs)');
    } else {
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
              <RhythmStep prefs={prefs} onChange={updatePrefs} />
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
