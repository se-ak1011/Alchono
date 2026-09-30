import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { UserPreferences } from '@/types';
import {
  PaperLabel,
  PaperInput,
  PaperTickRow,
  PaperSwitchRow,
  PaperChips,
  PaperCount,
  INK_SOFT as PINK_SOFT,
} from '@/components/paper/PaperForm';

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
    const current = prefs.familyMembers;
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    onChange({ familyMembers: next });
  };

  return (
    <View style={{ gap: 24 }}>
      <View>
        <PaperLabel>Who's at home</PaperLabel>
        {FAMILY_OPTIONS.map(({ key, label }) => {
          const selected = prefs.familyMembers.includes(key);
          return (
            <View key={key}>
              <PaperTickRow label={label} selected={selected} onPress={() => toggleFamily(key)} />

              {selected && key === 'partner' && (
                <Animated.View entering={FadeIn.duration(300)} style={{ marginLeft: 32, marginBottom: 6 }}>
                  <PaperInput
                    value={prefs.partnerName}
                    onChangeText={(t) => onChange({ partnerName: t })}
                    placeholder="Their name?"
                  />
                </Animated.View>
              )}

              {selected && key === 'children' && (
                <Animated.View entering={FadeIn.duration(300)} style={{ marginLeft: 32, marginBottom: 6, gap: 8 }}>
                  <PaperCount
                    label="How many?"
                    options={CHILDREN_COUNTS}
                    value={prefs.childrenCount}
                    onChange={(v) => onChange({ childrenCount: v })}
                  />
                  <PaperInput
                    value={prefs.childrenNames}
                    onChangeText={(t) => onChange({ childrenNames: t })}
                    placeholder={prefs.childrenCount === 1 ? 'Their name?' : 'Their names? (e.g. Emma, Jake)'}
                  />
                </Animated.View>
              )}
            </View>
          );
        })}
      </View>

      <View>
        <PaperLabel>Pets</PaperLabel>
        <PaperSwitchRow
          label="I have a pet"
          value={prefs.hasPets}
          onToggle={() => onChange({ hasPets: !prefs.hasPets, petName: '', petCount: 1 })}
        />
        {prefs.hasPets && (
          <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 10, gap: 10 }}>
            <PaperCount
              label="How many?"
              options={PET_COUNTS}
              value={prefs.petCount}
              onChange={(v) => onChange({ petCount: v })}
            />
            <PaperInput
              value={prefs.petName}
              onChangeText={(t) => onChange({ petName: t })}
              placeholder={prefs.petCount === 1 ? "What's their name?" : 'What are their names?'}
            />
          </Animated.View>
        )}
      </View>

      <View>
        <PaperLabel>Curious about</PaperLabel>
        <PaperSwitchRow
          label="Alcohol-free alternatives"
          sublabel="0.0 beers, spirits… If they're a trigger for you, leave this off — you know yourself best."
          value={prefs.interestedInAlternatives}
          onToggle={() => onChange({ interestedInAlternatives: !prefs.interestedInAlternatives })}
        />
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
    <View style={{ gap: 24 }}>
      <View>
        <PaperLabel>Work</PaperLabel>
        <PaperSwitchRow
          label="I have a job"
          value={prefs.hasJob}
          onToggle={() => onChange({ hasJob: !prefs.hasJob, workShift: null, drinksAtWork: false })}
        />
        {prefs.hasJob && (
          <Animated.View entering={FadeIn.duration(300)} style={{ gap: 12, marginTop: 12 }}>
            <PaperChips
              options={SHIFT_OPTIONS}
              isSelected={(k) => prefs.workShift === k}
              onToggle={(k) => onChange({ workShift: prefs.workShift === k ? null : (k as UserPreferences['workShift']) })}
            />
            <PaperSwitchRow
              label="I sometimes drink during work"
              value={prefs.drinksAtWork}
              onToggle={() => onChange({ drinksAtWork: !prefs.drinksAtWork })}
            />
          </Animated.View>
        )}
      </View>

      <View>
        <PaperLabel>Location</PaperLabel>
        <PaperInput
          value={prefs.city}
          onChangeText={(t) => onChange({ city: t })}
          placeholder="City or area (optional — for local resources)"
        />
        <View style={{ marginTop: 12 }}>
          <PaperSwitchRow
            label="I live somewhere isolated"
            sublabel="Rural, remote."
            value={prefs.livesIsolated}
            onToggle={() => onChange({ livesIsolated: !prefs.livesIsolated })}
          />
        </View>
        <PaperSwitchRow
          label={locationCaptured ? 'Approximate location saved' : 'Show me people near me'}
          sublabel="Nearby community posts appear first. Rounded to ~10 km, never shown to anyone."
          value={locationCaptured}
          onToggle={onCaptureLocation}
        />
      </View>
    </View>
  );
}

// Suggested hobbies for "Things I enjoy". Plain strings (custom ones append).
export const HOBBY_SUGGESTIONS: string[] = [
  'Reading', 'Walking', 'Gym', 'Photography', 'Fishing', 'Motorcycles',
  'Gaming', 'Gardening', 'Cooking', 'Music', 'Art', 'Running', 'Cycling',
  'Swimming', 'Hiking', 'Yoga', 'Writing', 'Crafts', 'DIY', 'Film',
];

/** "Things I enjoy" — hobbies/interests. Personalisation context for the coach.
 *  Controlled: it edits prefs.hobbies via onChange; the page's Save persists. */
export function HobbiesStep({
  prefs,
  onChange,
}: {
  prefs: UserPreferences;
  onChange: (p: Partial<UserPreferences>) => void;
}) {
  const [custom, setCustom] = React.useState('');
  const selected = prefs.hobbies ?? [];
  const customOnes = selected.filter((h) => !HOBBY_SUGGESTIONS.includes(h));
  const allChips = [...HOBBY_SUGGESTIONS, ...customOnes];

  const toggle = (hobby: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({
      hobbies: selected.includes(hobby)
        ? selected.filter((h) => h !== hobby)
        : [...selected, hobby],
    });
  };
  const addCustom = () => {
    const h = custom.trim();
    if (!h || selected.includes(h)) { setCustom(''); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ hobbies: [...selected, h] });
    setCustom('');
  };

  return (
    <View>
      <View style={{ marginBottom: 16 }}>
        <PaperChips
          options={allChips.map((h) => ({ key: h, label: h }))}
          isSelected={(k) => selected.includes(k)}
          onToggle={(k) => toggle(k)}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <PaperInput
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
            returnKeyType="done"
            placeholder="Add your own"
            maxLength={40}
          />
        </View>
        <Pressable onPress={addCustom} disabled={!custom.trim()} hitSlop={8} style={{ paddingBottom: 6 }}>
          <Text style={{ fontFamily: 'PatrickHand', fontSize: 19, color: custom.trim() ? '#6b4f9e' : PINK_SOFT }}>+ Add</Text>
        </Pressable>
      </View>
    </View>
  );
}
