import React from 'react';
import { View, Text, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useProfessional } from '@/hooks/usePro';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { headingShadow } from '@/styles';

export default function ProProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const resetAuth = useAuthStore((s) => s.reset);
  const resetApp = useAppStore((s) => s.reset);
  const { data: pro } = useProfessional();

  const clearAllState = () => {
    queryClient.clear();
    resetApp();
    resetAuth();
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in at any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut().catch(() => {});
          clearAllState();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your professional account and all client links. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.functions.invoke('delete-account', {
              body: { userId: user?.id },
            });
            if (error) {
              Alert.alert('Could not delete account', error.message ?? 'Try again.');
              return;
            }
            clearAllState();
            await supabase.auth.signOut().catch(() => {});
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 pb-6">
          <Text
            className="text-text-primary text-3xl font-semibold tracking-tight mb-5"
            style={headingShadow}
          >
            Profile
          </Text>
          <View className="flex-row items-center gap-4">
            <Avatar username={profile?.username} imageUrl={profile?.avatar_url} size="lg" />
            <View className="flex-1">
              <Text className="text-text-primary text-xl font-semibold">
                {profile?.username ?? 'Counsellor'}
              </Text>
              <Text className="text-text-muted text-base mt-0.5">{user?.email}</Text>
              <Text
                className={`text-sm mt-1 ${pro?.verified ? 'text-accent' : 'text-text-muted'}`}
              >
                {pro?.verified ? '✓ Verified professional' : 'Verification pending'}
                {pro?.org ? ` · ${pro.org}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <SettingsSection
          title="Account"
          items={[
            {
              label: 'Account switcher',
              onPress: () => router.push('/admin/accounts'),
            },
            {
              label: 'Privacy policy',
              onPress: () =>
                Linking.openURL('https://se-ak1011.github.io/Alchono/privacy.html'),
            },
            {
              label: 'Sign out',
              onPress: handleSignOut,
            },
            {
              label: 'Delete account',
              danger: true,
              onPress: handleDeleteAccount,
            },
          ]}
        />

        <View className="mx-6 mt-2">
          <Text className="text-text-muted text-sm text-center leading-relaxed">
            Alchono for professionals · consent-first, always.{'\n'}v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
