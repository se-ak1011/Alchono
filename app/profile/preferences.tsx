import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  CircleStep,
  RhythmStep,
  DEFAULT_PREFERENCES,
} from '@/components/preferences/PreferenceSections';
import type { UserPreferences } from '@/types';

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuthStore();

  const [prefs, setPrefs] = useState<UserPreferences>({
    ...DEFAULT_PREFERENCES,
    ...((profile?.preferences as Partial<UserPreferences>) ?? {}),
  });
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const hadLocation = !!(profile as any)?.location_lat;
  const [saving, setSaving] = useState(false);

  const updatePrefs = (partial: Partial<UserPreferences>) =>
    setPrefs((p) => ({ ...p, ...partial }));

  const captureLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('No location access', 'You can enable it in your phone settings.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      setLatLng({
        lat: Math.round(pos.coords.latitude * 10) / 10,
        lng: Math.round(pos.coords.longitude * 10) / 10,
      });
    } catch {
      Alert.alert('Could not get location', 'Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        preferences: prefs as any,
        ...(latLng ? { location_lat: latLng.lat, location_lng: latLng.lng } : {}),
      })
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
        ? { ...updated, preferences: prefs as any }
        : { ...profile!, preferences: prefs as any },
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Your details are up to date.', [
      { text: 'Done', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <View
        className="flex-1"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center px-6 mb-4">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <Text className="text-text-secondary text-lg">←</Text>
          </Pressable>
          <Text className="text-text-primary text-lg font-semibold">
            My circumstances
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-text-secondary text-sm leading-relaxed mb-6">
            Life changes — new baby, new job, new town. Keep this current and
            the app keeps up with you.
          </Text>

          <CircleStep prefs={prefs} onChange={updatePrefs} />

          <View style={{ height: 28 }} />

          <RhythmStep
            prefs={prefs}
            onChange={updatePrefs}
            locationCaptured={!!latLng || hadLocation}
            onCaptureLocation={captureLocation}
          />
        </ScrollView>

        <View className="px-6 pt-3">
          <Button
            title="Save changes"
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
