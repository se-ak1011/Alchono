import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { UserPreferences } from '@/types';

export const FAMILY_OPTIONS = [
  { key: 'partner',  label: 'Partner' },
  { key: 'children', label: 'Children' },
  { key: 'parents',  label: 'Parents (I live with them)' },
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
};

export const nameInputStyle = {
  backgroundColor: '#161718',
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: '#F0F2F4',
  fontSize: 15,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
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
          placeholderTextColor="#5E6472"
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
