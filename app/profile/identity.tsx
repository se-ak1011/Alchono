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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const AVATARS = [
  '🦊', '🐺', '🦁', '🐻', '🐼', '🦉',
  '🦅', '🐬', '🐢', '🐝', '🦋', '🐙',
  '🌊', '🌙', '⭐', '🔥', '🌿', '🌸',
  '⚡', '🏔️', '🎧', '🎸', '⚽', '♟️',
];

export default function IdentityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuthStore();

  const [username, setUsername] = useState(profile?.username ?? '');
  const currentEmoji = profile?.avatar_url?.startsWith('emoji:')
    ? profile.avatar_url.slice(6)
    : null;
  const [emoji, setEmoji] = useState<string | null>(currentEmoji);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = username.trim();
    if (!user) return;
    if (name.length < 3) {
      Alert.alert('Too short', 'Usernames need at least 3 characters.');
      return;
    }
    setSaving(true);
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        username: name,
        avatar_url: emoji ? `emoji:${emoji}` : null,
      })
      .eq('id', user.id)
      .select()
      .maybeSingle();
    setSaving(false);

    if (error) {
      Alert.alert(
        'Could not save',
        error.code === '23505'
          ? 'That username is already taken — try another.'
          : error.message,
      );
      return;
    }
    if (updated) setProfile({ ...profile!, ...updated });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
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
        <View className="flex-row items-center px-6 mb-6">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <Text className="text-text-secondary text-lg">←</Text>
          </Pressable>
          <Text className="text-text-primary text-lg font-semibold">
            Name & avatar
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="items-center mb-8">
            <Avatar
              username={username}
              imageUrl={emoji ? `emoji:${emoji}` : null}
              size="lg"
            />
          </View>

          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
            hint="This is what mentors and the community see."
          />

          <Text className="text-text-secondary text-base font-medium mt-8 mb-3">
            Pick an avatar
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {AVATARS.map((e) => {
              const selected = emoji === e;
              return (
                <Pressable
                  key={e}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEmoji(selected ? null : e);
                  }}
                  style={{ width: 52, height: 52 }}
                  className={`items-center justify-center rounded-full border ${
                    selected
                      ? 'bg-accent/20 border-accent/60'
                      : 'bg-surface border-white/8'
                  }`}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-text-muted text-sm mt-3">
            No avatar picked? Your initial is used instead.
          </Text>
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
