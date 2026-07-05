import React from 'react';
import { ScrollView, View, Text, Alert, Share, Linking, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useIsAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { headingShadow } from '@/styles';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const resetAuth = useAuthStore((s) => s.reset);
  const resetApp = useAppStore((s) => s.reset);
  const { data: isAdmin } = useIsAdmin();
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
      'A full copy of your data will be prepared. You can save or share it however you like.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            const { data, error } = await supabase.functions.invoke('export-data', {
              body: { userId: user?.id },
            });
            if (error || !data?.data) {
              Alert.alert('Error', 'Could not prepare your export. Please try again.');
              return;
            }
            await Share.share({
              title: 'Alchono data export',
              message: JSON.stringify(data.data, null, 2),
            });
          },
        },
      ],
    );
  };

  return (
    <SafeArea>
      <View className="px-6 pt-4 pb-5 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#9B98A8" />
        </Pressable>
        <Text className="text-text-primary text-3xl font-semibold tracking-tight" style={headingShadow}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <NotificationSettings />

        <SettingsSection
          title="Quick log"
          items={[
            {
              label: 'Log a drink with Siri or Back Tap',
              onPress: () =>
                Alert.alert(
                  'Log a drink without opening the app',
                  'Say "Hey Siri, I had a drink."\n\n' +
                    'Back Tap: Settings → Accessibility → Touch → Back Tap → ' +
                    'Triple Tap → Shortcuts → I had a drink.\n\n' +
                    'Action Button (iPhone 15 Pro and later): Settings → ' +
                    'Action Button → Shortcut → I had a drink.\n\n' +
                    'It logs to your current session, or gently starts one — no ' +
                    'need to open the app.',
                ),
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
            {
              label: 'Privacy policy',
              onPress: () =>
                Linking.openURL('https://se-ak1011.github.io/Alchono/privacy.html'),
            },
          ]}
        />

        {isAdmin && (
          <SettingsSection
            title="Admin"
            items={[
              {
                label: 'Reports & disputes',
                onPress: () => router.push('/admin/reports'),
              },
              {
                label: 'Good feed videos',
                onPress: () => router.push('/admin/good-feed'),
              },
              {
                label: 'Counsellor verification',
                onPress: () => router.push('/admin/professionals'),
              },
              {
                label: 'Account switcher',
                onPress: () => router.push('/admin/accounts'),
              },
            ]}
          />
        )}

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
