import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  getSavedAccounts,
  saveAccount,
  removeAccount,
  switchToAccount,
  type SavedAccount,
} from '@/lib/accountSwitcher';

export default function AccountSwitcherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    getSavedAccounts().then(setAccounts);
  }, []);

  const handleSaveCurrent = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAccounts(await saveAccount(data.session, profile?.username ?? 'unnamed'));
  };

  const handleSwitch = async (account: SavedAccount) => {
    if (account.userId === user?.id) return;
    setSwitching(true);
    try {
      await switchToAccount(account);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // AuthGate takes over from here (member -> tabs, professional -> /pro).
      router.replace('/(tabs)' as any);
    } catch (e) {
      Alert.alert('Could not switch', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12 }}
    >
      <View className="flex-row items-center px-6 mb-4">
        <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
          <Text className="text-text-secondary text-lg">←</Text>
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">Account switcher</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-text-muted text-sm leading-relaxed mb-5">
          Testing tool: saved accounts swap instantly, no passwords. Sessions
          are stored on this device only.
        </Text>

        <Button
          title={`Save current (${profile?.username ?? user?.email ?? '…'})`}
          variant="secondary"
          size="md"
          fullWidth
          onPress={handleSaveCurrent}
        />

        <View className="mt-6">
          {accounts.map((a) => {
            const isActive = a.userId === user?.id;
            return (
              <View
                key={a.userId}
                className={`flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3 mb-2 border ${
                  isActive ? 'border-accent/40' : 'border-white/5'
                }`}
              >
                <Avatar username={a.label} size="sm" />
                <View className="flex-1">
                  <Text className="text-text-primary text-sm font-medium">{a.label}</Text>
                  <Text className="text-text-muted text-xs">{a.email}</Text>
                </View>
                {isActive ? (
                  <Text className="text-text-muted text-xs">current</Text>
                ) : (
                  <Pressable
                    disabled={switching}
                    onPress={() => handleSwitch(a)}
                    className="bg-accent rounded-lg px-4 py-2"
                  >
                    <Text className="text-bg text-xs font-semibold">
                      {switching ? '…' : 'Switch'}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={async () => setAccounts(await removeAccount(a.userId))}
                  hitSlop={10}
                >
                  <Text className="text-text-muted text-base">×</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
