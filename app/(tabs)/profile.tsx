import React from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { Avatar } from '@/components/ui/Avatar';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { headingShadow } from '@/styles';

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const resetAuth = useAuthStore((s) => s.reset);
  const resetApp = useAppStore((s) => s.reset);
  const router = useRouter();

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
      'This will permanently delete all your data. This cannot be undone.',
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
              // Try to extract the body the edge function returned (400 responses
              // come back as FunctionsHttpError; the real message is in the body).
              let detail = error.message ?? 'Unknown error';
              try {
                const body = await (error as any).context?.json?.();
                if (body?.error) detail = body.error;
              } catch {}
              Alert.alert(
                'Could not delete account',
                `${detail}\n\nIf this keeps happening, the delete-account Edge Function may need to be deployed or the SUPABASE_SERVICE_ROLE_KEY secret may not be set.`,
              );
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
        <View className="px-6 pt-5 pb-6">
          <Text className="text-text-primary text-3xl font-semibold tracking-tight mb-5" style={headingShadow}>
            Profile
          </Text>
          <View className="flex-row items-center gap-4">
            <Avatar
              username={profile?.username}
              imageUrl={profile?.avatar_url}
              size="lg"
            />
            <View>
              <Text className="text-text-primary text-xl font-semibold">
                {profile?.username ?? 'Anonymous'}
              </Text>
              <Text className="text-text-muted text-base mt-0.5">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <NotificationSettings />

        <SettingsSection
          title="Community"
          items={[
            {
              label: 'Messages',
              onPress: () => router.push('/messages'),
            },
            {
              label: profile?.is_mentor ? 'Your mentoring' : 'Become a mentor',
              onPress: () => router.push('/profile/become-mentor'),
            },
          ]}
        />

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
          <Text className="text-text-muted text-sm text-center leading-relaxed">
            Alchono · Your data is private and never sold.{'\n'}
            v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeArea>
  );
}
