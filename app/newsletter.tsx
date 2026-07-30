import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { headingShadow } from '@/styles';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

/**
 * The Zine — an opt-in, every-couple-of-months newsletter. Off by default and
 * entirely the member's choice. Stores the choice on the profile; the email
 * itself already lives on the account.
 */
export default function NewsletterScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [optedIn, setOptedIn] = useState<boolean>(!!(profile as any)?.newsletter_opt_in);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (saving || !user) return;
    const next = !optedIn;
    setOptedIn(next);
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ newsletter_opt_in: next })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setOptedIn(!next);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  };

  return (
    <SafeArea>
      <ZoneGlow zone="reading" intensity={1.2} />
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 32 }}>
          The Zine
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text className="text-text-secondary text-base leading-relaxed mb-4">
          Every couple of months, a small, slow thing in your inbox — made to be printed if you
          like. A few real stories, a puzzle, a dilemma to sit with, and a drink to make. No
          feeds, no scrolling. The internet the way it used to feel.
        </Text>
        <Text className="text-text-muted text-sm leading-relaxed mb-6">
          Any stories are shared only with permission and always anonymised. You can turn this
          off any time, and it goes to the email on your account.
        </Text>

        <Pressable
          onPress={toggle}
          className="flex-row items-center justify-between bg-surface rounded-2xl px-5 py-4 border border-white/8 active:opacity-80"
        >
          <View className="flex-1 pr-3">
            <Text className="text-text-primary text-base font-semibold">Send me the zine</Text>
            <Text className="text-text-muted text-sm mt-0.5" numberOfLines={1}>
              {user?.email ?? 'Your account email'}
            </Text>
          </View>
          <View className={`w-12 h-7 rounded-full px-0.5 justify-center ${optedIn ? 'bg-accent' : 'bg-surface-2 border border-white/10'}`}>
            <View className={`w-6 h-6 rounded-full bg-white ${optedIn ? 'self-end' : 'self-start'}`} />
          </View>
        </Pressable>

        {optedIn ? (
          <Text className="text-text-muted text-sm leading-relaxed mt-4">
            You're on the list. The next issue will find you when it's ready — no rush, no spam.
          </Text>
        ) : null}
      </ScrollView>
    </SafeArea>
  );
}
