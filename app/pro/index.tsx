import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import {
  useProfessional,
  useMyClients,
  useRequestClient,
  useClientTrends,
  type ClientLink,
} from '@/hooks/usePro';
import { headingShadow } from '@/styles';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="bg-surface-2 rounded-xl px-3 py-2.5 border border-white/5" style={{ minWidth: 92 }}>
      <Text className="text-text-primary text-lg font-semibold">{value}</Text>
      <Text className="text-text-muted text-xs mt-0.5">{label}</Text>
    </View>
  );
}

function ClientCard({ link }: { link: ClientLink }) {
  const accepted = link.status === 'accepted';
  const { data: t } = useClientTrends(link.id, accepted);

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/8"
    >
      <View className="flex-row items-center gap-3 mb-3">
        <Avatar username={link.otherUsername} size="sm" />
        <View className="flex-1">
          <Text className="text-text-primary text-base font-semibold">
            {link.otherUsername}
          </Text>
          <Text className="text-text-muted text-xs">
            {accepted
              ? t?.last_active
                ? `Last active ${new Date(t.last_active + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                : 'Consented'
              : 'Awaiting their consent'}
          </Text>
        </View>
        {accepted && t?.checked_in_today && (
          <Text className="text-text-secondary text-xs">✅ today</Text>
        )}
      </View>

      {accepted && t && (
        <>
          <View className="flex-row flex-wrap gap-2">
            <Stat label="AF days · 30d" value={t.af_days_30} />
            <Stat label="Got through" value={`${t.urges_beaten_30}/${t.urges_faced_30}`} />
            <Stat label="Sessions · 30d" value={t.sessions_30} />
            <Stat label="Journalling" value={t.journal_notes_30} />
          </View>
          {t.top_mood && (
            <Text className="text-text-muted text-sm mt-3">
              Most common mood: <Text className="text-text-secondary capitalize">{t.top_mood}</Text>
            </Text>
          )}
        </>
      )}
    </Animated.View>
  );
}

export default function ProDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const { data: pro } = useProfessional();
  const { data: clients } = useMyClients();
  const { mutate: requestClient, isPending: requesting } = useRequestClient();
  const [username, setUsername] = useState('');

  const handleAdd = () => {
    if (!username.trim()) return;
    requestClient(username, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUsername('');
        Alert.alert('Request sent', 'They approve or decline it in their app. Nothing is shared until they say yes.');
      },
      onError: (e) =>
        Alert.alert('Could not send', e instanceof Error ? e.message : 'Try again.'),
    });
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-start justify-between px-6 mb-4">
        <View className="flex-1">
          <Text className="text-text-primary text-2xl font-semibold" style={headingShadow}>
            Your clients.
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            {profile?.username ?? 'Counsellor'}{pro?.org ? ` · ${pro.org}` : ''}
          </Text>
        </View>

      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {pro && !pro.verified && (
          <View className="bg-surface rounded-2xl px-5 py-4 mb-5 border border-[#8A6D1B]">
            <Text className="text-text-primary text-base font-semibold mb-1">
              Verification pending
            </Text>
            <Text className="text-text-secondary text-sm leading-relaxed">
              We review every professional account by hand. You'll be able to
              add clients once verified — usually within a day.
            </Text>
          </View>
        )}

        {/* Add client */}
        <View className="bg-surface rounded-2xl p-4 mb-6 border border-white/8">
          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-2">
            Add a client
          </Text>
          <Text className="text-text-muted text-sm leading-relaxed mb-3">
            Ask your client for their exact Alchono username or their QR code.
            You can only see their trends after they approve — and they can
            revoke at any time. Journals and conversations are never visible.
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Exact username"
            placeholderTextColor="#5E6472"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: '#161718',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: '#F0F2F4',
              fontSize: 15,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              marginBottom: 10,
            }}
          />
          <Button
            title={requesting ? 'Sending…' : 'Send consent request'}
            variant="primary"
            size="md"
            fullWidth
            loading={requesting}
            onPress={handleAdd}
          />
        </View>

        {(clients ?? []).length === 0 ? (
          <View className="py-10 items-center px-6">
            <Text className="text-text-muted text-base text-center leading-relaxed">
              No clients yet.{'\n'}Each one starts with their consent.
            </Text>
          </View>
        ) : (
          (clients ?? []).map((l) => <ClientCard key={l.id} link={l} />)
        )}
      </ScrollView>
    </View>
  );
}
