import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PREFERENCES } from '@/components/preferences/PreferenceSections';
import type { UserPreferences } from '@/types';

const HOBBY_SUGGESTIONS = [
  'Reading',
  'Walking',
  'Gym',
  'Photography',
  'Fishing',
  'Motorcycles',
  'Gaming',
  'Gardening',
  'Cooking',
  'Music',
  'Art',
  'Running',
  'Cycling',
  'Swimming',
  'Hiking',
  'Yoga',
  'Writing',
  'Crafts',
  'DIY',
  'Film',
];

export default function HobbiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuthStore();

  const existingPrefs = (profile?.preferences as Partial<UserPreferences>) ?? {};
  const [selected, setSelected] = useState<string[]>(
    existingPrefs.hobbies ?? [],
  );
  const [customInput, setCustomInput] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (hobby: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby],
    );
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    // Normalise: capitalise first letter, lowercase the rest
    const normalised = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (!selected.includes(normalised)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelected((prev) => [...prev, normalised]);
    }
    setCustomInput('');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const merged: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...existingPrefs,
      hobbies: selected,
    };
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ preferences: merged as any })
      .eq('id', user.id)
      .select()
      .maybeSingle();
    setSaving(false);

    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    setProfile(
      updated
        ? { ...updated, preferences: merged as any }
        : { ...profile!, preferences: merged as any },
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  // All suggestions + any custom ones not in the preset list
  const customOnes = selected.filter((h) => !HOBBY_SUGGESTIONS.includes(h));
  const allChips = [...HOBBY_SUGGESTIONS, ...customOnes];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <View
        className="flex-1"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12 }}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 mb-4">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <Text className="text-text-secondary text-lg">←</Text>
          </Pressable>
          <Text className="text-text-primary text-lg font-semibold">
            Things I enjoy
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-text-secondary text-sm leading-relaxed mb-6">
            Tap the things you enjoy. This helps personalise your experience — the app
            can weave these into reflections and suggestions over time.
          </Text>

          {/* Chip grid */}
          <Animated.View entering={FadeIn.duration(400)} className="flex-row flex-wrap gap-2 mb-6">
            {allChips.map((hobby) => {
              const isSelected = selected.includes(hobby);
              return (
                <Pressable
                  key={hobby}
                  onPress={() => toggle(hobby)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    isSelected
                      ? 'bg-surface border-white/25'
                      : 'bg-surface-2 border-white/5 active:border-white/15'
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
                      isSelected ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {hobby}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Add a custom hobby */}
          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
            Add your own
          </Text>
          <View className="flex-row gap-2">
            <TextInput
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={addCustom}
              returnKeyType="done"
              placeholder="e.g. Bouldering"
              placeholderTextColor="#5E6472"
              maxLength={40}
              className="flex-1 bg-surface rounded-xl px-4 py-3 text-text-primary text-base border border-white/8"
              selectionColor="#9CA3AF"
            />
            <Pressable
              onPress={addCustom}
              disabled={!customInput.trim()}
              className={`px-4 rounded-xl border items-center justify-center ${
                customInput.trim()
                  ? 'bg-accent border-transparent active:bg-accent-dark'
                  : 'bg-surface-2 border-white/5'
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  customInput.trim() ? 'text-bg' : 'text-text-muted'
                }`}
              >
                Add
              </Text>
            </Pressable>
          </View>

          {selected.length > 0 && (
            <Text className="text-text-muted text-xs mt-4 leading-relaxed">
              {selected.length} selected · these stay private to you
            </Text>
          )}
        </ScrollView>

        <View className="px-6 pt-3">
          <Button
            title="Save"
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            onPress={handleSave}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
