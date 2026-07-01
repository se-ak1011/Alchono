import React from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { Avatar } from '@/components/ui/Avatar';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { useAuthStore } from '@/store/authStore';
import { useSignOut } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { headingShadow } from '@/styles';

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useSignOut();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in at any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently delete all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await supabase.functions.invoke('delete-account', {
              body: { userId: user?.id },
            });
            await signOut();
          },
        },
      ],
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export data',
      'Your data will be prepared and sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            await supabase.functions.invoke('export-data', {
              body: { userId: user?.id },
            });
            Alert.alert('Done', 'Check your email in a few minutes.');
          },
        },
      ],
    );
  };

  return (
    <SafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 pt-4 pb-6">
          <Text className="text-text-primary text-2xl font-semibold tracking-tight mb-4" style={headingShadow}>
            Profile
          </Text>
          <View className="flex-row items-center gap-4">
            <Avatar
              username={profile?.username}
              imageUrl={profile?.avatar_url}
              size="lg"
            />
            <View>
              <Text className="text-text-primary text-lg font-semibold">
                {profile?.username ?? 'Anonymous'}
              </Text>
              <Text className="text-text-muted text-sm mt-0.5">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <NotificationSettings />

        <SettingsSection
          title="Privacy"
          items={[
            {
              label: 'Emergency contacts',
              onPress: () => router.push('/profile/emergency-contacts'),
            },
            {
              label: 'Export my data',
              onPress: handleExportData,
            },
          ]}
        />

        <SettingsSection
          title="Account"
          items={[
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
          <Text className="text-text-muted text-xs text-center leading-relaxed">
            Alchono · Your data is private and never sold.{'\n'}
            v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeArea>
  );
}
