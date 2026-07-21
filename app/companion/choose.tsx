import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { CompanionCarousel } from '@/components/companion/CompanionCarousel';
import { DEFAULT_PREFERENCES } from '@/components/preferences/PreferenceSections';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { headingShadow } from '@/styles';
import type { UserPreferences } from '@/types';

export default function ChooseCompanionScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const prefs = (profile?.preferences as UserPreferences | null) ?? null;

  const choose = async (companionId: string) => {
    if (!user) return;
    const merged: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(prefs ?? {}),
      companionId,
    };
    // Optimistic — the companion should switch instantly across the app.
    setProfile({ ...profile!, preferences: merged as any });
    await supabase
      .from('profiles')
      .update({ preferences: merged as any })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.warn('[companion] save failed:', error.message);
      });
  };

  return (
    <SafeArea>
      <View className="px-6 pt-4 pb-3 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#817B91" />
        </Pressable>
        <Text className="text-text-primary text-3xl font-semibold tracking-tight" style={headingShadow}>
          Your companion
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
      >
        <Text className="text-text-secondary text-base leading-relaxed mb-8 px-6">
          A mate to walk beside you — not a version of you. Pick whoever feels
          right. You can change your mind any time.
        </Text>
        <CompanionCarousel value={prefs?.companionId} onChange={choose} />
      </ScrollView>
    </SafeArea>
  );
}
