import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { UserPreferences } from '@/types';

export const FAMILY_OPTIONS = [
  { key: 'partner',  label: 'Partner' },
  { key: 'children', label: 'Children' },
] as const;

export const SHIFT_OPTIONS = [
  { key: 'morning', label: 'Morning' },
  { key: 'day', label: 'Daytime' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
] as const;

export const CHILDREN_COUNTS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4+' },
];

export const PET_COUNTS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3+' },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
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
  livesIsolated: false,
  interestedInAlternatives: false,
  hobbies: [],
  joinReasons: [],
  drinkFrequency: null,
  drinkTypes: [],
  drinkAmount: null,
  drinkTriggers: [],
};

// ── Onboarding option sets (shared by the onboarding screens + AI context) ──
// Kept human and non-clinical: these describe a life, not a diagnosis.
export const JOIN_REASONS = [
  { key: 'stop', label: 'I want to stop drinking' },
  { key: 'cut-down', label: 'I want to cut down' },
  { key: 'worried', label: 'I’m worried alcohol is taking over' },
  { key: 'exploring', label: 'I’m just exploring' },
] as const;

export const DRINK_FREQUENCIES = [
  { key: 'rarely', label: 'Rarely' },
  { key: 'weekly', label: 'About once a week' },
  { key: 'few-week', label: 'A few times a week' },
  { key: 'most-days', label: 'Most days' },
  { key: 'daily', label: 'Every day' },
] as const;

export const DRINK_TYPES = [
  { key: 'beer', label: 'Beer' },
  { key: 'wine', label: 'Wine' },
  { key: 'spirits', label: 'Spirits' },
  { key: 'cider', label: 'Cider' },
  { key: 'cocktails', label: 'Cocktails' },
  { key: 'mixed', label: 'A mix' },
] as const;

export const DRINK_AMOUNTS = [
  { key: 'light', label: 'Just a little' },
  { key: 'moderate', label: 'A moderate amount' },
  { key: 'heavy', label: 'Quite a lot' },
  { key: 'varies', label: 'It really varies' },
] as const;

export const DRINK_TRIGGERS = [
  { key: 'stress', label: 'Stress' },
  { key: 'anxiety', label: 'Anxiety' },
  { key: 'pain', label: 'Pain' },
  { key: 'habit', label: 'Habit' },
  { key: 'social', label: 'Social' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'loneliness', label: 'Loneliness' },
  { key: 'celebration', label: 'Celebration' },
  { key: 'other', label: 'Other' },
] as const;

export const nameInputStyle = {
  backgroundColor: '#383243',
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: '#ECE9F1',
  fontSize: 15,
  borderWidth: 1,
  borderColor: 'rgba(243, 240, 244, 0.10)',
} as const;

export function CountPicker({
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
                backgroundColor: selected ? '#A489DE' : '#383243',
                borderWidth: 1,
                borderColor: selected ? '#A489DE' : 'rgba(243, 240, 244, 0.10)',
              }}
            >
              <Text
                style={{
                  color: selected ? '#201D28' : '#B2ACC0',
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

export function ToggleRow({
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
          backgroundColor: value ? '#A489DE' : '#474151',
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
            backgroundColor: '#ECE9F1',
          }}
        />
      </View>
    </Pressable>
  );
}

export function CircleStep({
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
          Who's at home
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
                      placeholderTextColor="#817B91"
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
                      placeholderTextColor="#817B91"
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
              placeholderTextColor="#817B91"
              style={[nameInputStyle, { borderRadius: 12, marginTop: 4 }]}
            />
          </Animated.View>
        )}
      </View>

      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          Curious about
        </Text>
        <ToggleRow
          label="Alcohol-free alternatives (0.0 beers, spirits…)"
          value={prefs.interestedInAlternatives}
          onToggle={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange({ interestedInAlternatives: !prefs.interestedInAlternatives });
          }}
        />
        <Text className="text-text-muted text-xs mt-2 leading-relaxed">
          If zero-alcohol drinks are a trigger for you, leave this off — you
          know yourself best.
        </Text>
      </View>
    </View>
  );
}

/**
 * A row of selectable pills — the app's quiet hierarchy (tone + border, never
 * bold fills). Works as multi-select or single-select.
 */
export function SelectChips({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: readonly { key: string; label: string }[];
  selected: string[];
  onToggle: (key: string) => void;
  multi?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map(({ key, label }) => {
        const isOn = selected.includes(key);
        return (
          <Pressable
            key={key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(key);
            }}
            className={`px-4 py-2.5 rounded-xl border ${
              isOn ? 'bg-surface border-white/25' : 'bg-surface border-white/8'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isOn ? 'text-text-primary' : 'text-text-muted'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "What brings you here?" — reasons for joining. Multi-select. */
export function ReasonsStep({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: Partial<UserPreferences>) => void;
}) {
  const toggle = (key: string) => {
    const cur = prefs.joinReasons ?? [];
    onChange({
      joinReasons: cur.includes(key)
        ? cur.filter((k) => k !== key)
        : [...cur, key],
    });
  };
  return (
    <SelectChips
      options={JOIN_REASONS}
      selected={prefs.joinReasons ?? []}
      onToggle={toggle}
    />
  );
}

/**
 * The optional "understand your drinking a little better" step. Approximate,
 * human, non-clinical: cadence, what, roughly how much, and what leads to it.
 */
export function DrinkingStep({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: Partial<UserPreferences>) => void;
}) {
  const toggleType = (key: string) => {
    const cur = prefs.drinkTypes ?? [];
    onChange({
      drinkTypes: cur.includes(key)
        ? cur.filter((k) => k !== key)
        : [...cur, key],
    });
  };
  const toggleTrigger = (key: string) => {
    const cur = prefs.drinkTriggers ?? [];
    onChange({
      drinkTriggers: cur.includes(key)
        ? cur.filter((k) => k !== key)
        : [...cur, key],
    });
  };
  return (
    <View style={{ gap: 22 }}>
      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          How often do you drink?
        </Text>
        <SelectChips
          options={DRINK_FREQUENCIES}
          selected={prefs.drinkFrequency ? [prefs.drinkFrequency] : []}
          multi={false}
          onToggle={(key) =>
            onChange({ drinkFrequency: prefs.drinkFrequency === key ? null : key })
          }
        />
      </View>
      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          What do you usually drink?
        </Text>
        <SelectChips
          options={DRINK_TYPES}
          selected={prefs.drinkTypes ?? []}
          onToggle={toggleType}
        />
      </View>
      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          Roughly how much?
        </Text>
        <SelectChips
          options={DRINK_AMOUNTS}
          selected={prefs.drinkAmount ? [prefs.drinkAmount] : []}
          multi={false}
          onToggle={(key) =>
            onChange({ drinkAmount: prefs.drinkAmount === key ? null : key })
          }
        />
      </View>
      <View>
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
          What usually leads you to drink?
        </Text>
        <SelectChips
          options={DRINK_TRIGGERS}
          selected={prefs.drinkTriggers ?? []}
          onToggle={toggleTrigger}
        />
      </View>
    </View>
  );
}

export function RhythmStep({
  prefs,
  onChange,
  locationCaptured,
  onCaptureLocation,
}: {
  prefs: UserPreferences;
  onChange: (p: Partial<UserPreferences>) => void;
  locationCaptured: boolean;
  onCaptureLocation: () => void;
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
          placeholderTextColor="#817B91"
          style={nameInputStyle}
        />

        <View style={{ marginTop: 8 }}>
          <ToggleRow
            label="I live somewhere isolated (rural, remote)"
            value={prefs.livesIsolated}
            onToggle={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange({ livesIsolated: !prefs.livesIsolated });
            }}
          />
        </View>

        <Pressable
          onPress={onCaptureLocation}
          className={`flex-row items-center justify-between rounded-xl px-4 py-3.5 border mt-2 ${
            locationCaptured
              ? 'bg-surface border-white/25'
              : 'bg-surface border-white/8 active:border-white/20'
          }`}
        >
          <View className="flex-1 pr-3">
            <Text className="text-text-primary text-sm font-medium">
              {locationCaptured
                ? 'Approximate location saved'
                : 'Show me people near me (optional)'}
            </Text>
            <Text className="text-text-muted text-xs mt-0.5 leading-relaxed">
              Community posts from nearby people appear first. Your location is
              rounded to ~10 km and never shown to anyone.
            </Text>
          </View>
          <Text className="text-text-muted text-sm">{locationCaptured ? '◆' : '◇'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
