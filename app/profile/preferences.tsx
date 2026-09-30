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
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { PaperLabel, PaperButton, INK, INK_SOFT } from '@/components/paper/PaperForm';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  CircleStep,
  RhythmStep,
  HobbiesStep,
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
    <PaperBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingBottom: 6 }}>
            <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
              <Feather name="chevron-left" size={26} color={INK} />
            </Pressable>
            <Text style={{ fontFamily: 'PatrickHand', fontSize: 30, color: INK }}>My circumstances</Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ color: INK_SOFT, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
              Life changes — new baby, new job, new town. Keep this current and the app keeps up with you.
            </Text>

            <CircleStep prefs={prefs} onChange={updatePrefs} />

            <View style={{ height: 28 }} />

            <RhythmStep
              prefs={prefs}
              onChange={updatePrefs}
              locationCaptured={!!latLng || hadLocation}
              onCaptureLocation={captureLocation}
            />

            <View style={{ height: 28 }} />

            <PaperLabel>Things I enjoy</PaperLabel>
            <Text style={{ color: INK_SOFT, fontSize: 13, lineHeight: 18, marginBottom: 14 }}>
              The good stuff — what a better day looks like. Helps the coach point you back towards it.
            </Text>
            <HobbiesStep prefs={prefs} onChange={updatePrefs} />
          </ScrollView>

          <View style={{ paddingHorizontal: 28, paddingTop: 8 }}>
            <PaperButton title="Save changes" loading={saving} onPress={handleSave} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </PaperBackground>
  );
}
