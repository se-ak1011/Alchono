import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Linking, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useProfessional, useUpdatePractice } from '@/hooks/usePro';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { headingShadow } from '@/styles';

const proInput = {
  backgroundColor: '#161718',
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: '#F0F2F4',
  fontSize: 15,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
} as const;

export default function ProProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const resetAuth = useAuthStore((s) => s.reset);
  const resetApp = useAppStore((s) => s.reset);
  const { data: pro } = useProfessional();
  const { mutate: updatePractice, isPending: saving } = useUpdatePractice();
  const [org, setOrg] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [booking, setBooking] = useState('');
  const [listed, setListed] = useState(true);

  useEffect(() => {
    if (pro) {
      setOrg(pro.org ?? '');
      setBio(pro.bio ?? '');
      setWebsite(pro.website_url ?? '');
      setBooking(pro.booking_url ?? '');
      setListed(pro.listed ?? true);
    }
  }, [pro?.user_id]);

  const handleSavePractice = () => {
    updatePractice(
      {
        org: org.trim() || null,
        bio: bio.trim() || null,
        website_url: website.trim() || null,
        booking_url: booking.trim() || null,
        listed,
      },
      {
        onSuccess: () => Alert.alert('Saved', 'Your listing is up to date.'),
        onError: (e) =>
          Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  };


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

        {/* Practice details — powers the public directory listing */}
        <View className="mx-6 mb-6 bg-surface rounded-2xl p-4 border border-white/8">
          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
            Your listing
          </Text>
          <View style={{ gap: 10 }}>
            <TextInput value={org} onChangeText={setOrg}
              placeholder="Organisation / practice name" placeholderTextColor="#5E6472"
              style={proInput} />
            <TextInput value={bio} onChangeText={setBio} multiline maxLength={240}
              placeholder="A few words about how you work…" placeholderTextColor="#5E6472"
              style={[proInput, { minHeight: 72 }]} textAlignVertical="top" />
            <TextInput value={website} onChangeText={setWebsite}
              placeholder="Website (https://…)" placeholderTextColor="#5E6472"
              autoCapitalize="none" autoCorrect={false} keyboardType="url"
              style={proInput} />
            <TextInput value={booking} onChangeText={setBooking}
              placeholder="Booking link (Calendly, your site…)" placeholderTextColor="#5E6472"
              autoCapitalize="none" autoCorrect={false} keyboardType="url"
              style={proInput} />
            <Pressable
              onPress={() => setListed((v) => !v)}
              className="flex-row items-center justify-between bg-surface-2 rounded-xl px-4 py-3 border border-white/5"
            >
              <Text className="text-text-primary text-sm font-medium flex-1 pr-3">
                Listed in the counsellor directory
              </Text>
              <Text className="text-text-muted text-sm">{listed ? '◆ On' : '◇ Off'}</Text>
            </Pressable>
            <Button
              title={saving ? 'Saving…' : 'Save listing'}
              variant="primary" size="md" fullWidth loading={saving}
              onPress={handleSavePractice}
            />
            {!pro?.verified && (
              <Text className="text-text-muted text-xs leading-relaxed">
                Your listing appears in the directory once your account is verified.
              </Text>
            )}
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
