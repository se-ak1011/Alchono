import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import {
  useMyTrustedPeople,
  usePeopleITrustFor,
  useInviteTrusted,
  useRespondTrusted,
  useRemoveTrusted,
  useTrustedSignals,
  type TrustedLink,
} from '@/hooks/useTrustedPerson';

function SignalChip({ on, onLabel, offLabel, tone }: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  tone: 'good' | 'warn' | 'alert';
}) {
  const colors =
    !on
      ? 'bg-surface-2 border-white/5'
      : tone === 'good'
        ? 'bg-accent/15 border-accent/40'
        : tone === 'warn'
          ? 'bg-[#3A2E14] border-[#8A6D1B]'
          : 'bg-[#3A1414] border-[#8A2B2B]';
  return (
    <View className={`px-3 py-2 rounded-lg border ${colors}`}>
      <Text className={`text-xs font-medium ${on ? 'text-text-primary' : 'text-text-muted'}`}>
        {on ? onLabel : offLabel}
      </Text>
    </View>
  );
}

function SignalsCard({ link }: { link: TrustedLink }) {
  const { data: signals } = useTrustedSignals(link.id);
  return (
    <View className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/8">
      <View className="flex-row items-center gap-3 mb-3">
        <Avatar username={link.otherUsername} size="sm" />
        <Text className="text-text-primary text-base font-semibold flex-1">
          {link.otherUsername}
        </Text>
        <Text className="text-text-muted text-xs">today</Text>
      </View>
      {signals ? (
        <View className="flex-row flex-wrap gap-2">
          <SignalChip on={signals.checked_in_today} tone="good"
            onLabel="✅ Checked in" offLabel="— No check-in yet" />
          <SignalChip on={signals.urge_beaten_today} tone="good"
            onLabel="✅ Got through a hard moment" offLabel="— None logged yet" />
          <SignalChip on={signals.rough_day} tone="warn"
            onLabel="🟡 Rough day" offLabel="— Mood steady" />
          <SignalChip on={signals.asked_for_support} tone="alert"
            onLabel="🔴 Reached for support" offLabel="— No SOS" />
        </View>
      ) : (
        <Text className="text-text-muted text-sm">Loading…</Text>
      )}
      {signals?.asked_for_support && (
        <Text className="text-text-secondary text-sm mt-3 leading-relaxed">
          Now's a good moment for a call or a knock on the door.
        </Text>
      )}
    </View>
  );
}

export default function TrustedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: mine } = useMyTrustedPeople();
  const { data: forOthers } = usePeopleITrustFor();
  const { mutate: invite, isPending: inviting } = useInviteTrusted();
  const { mutate: respond } = useRespondTrusted();
  const { mutate: remove } = useRemoveTrusted();
  const [username, setUsername] = useState('');

  const pendingForMe = (forOthers ?? []).filter((l) => l.status === 'pending');
  const acceptedForMe = (forOthers ?? []).filter((l) => l.status === 'accepted');

  const handleInvite = () => {
    if (!username.trim()) return;
    invite(username, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUsername('');
        Alert.alert('Invited', 'They can accept from their profile.');
      },
      onError: (e) =>
        Alert.alert('Could not invite', e instanceof Error ? e.message : 'Try again.'),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <View
        className="flex-1"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center px-6 mb-4">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <Text className="text-text-secondary text-lg">←</Text>
          </Pressable>
          <Text className="text-text-primary text-lg font-semibold">Trusted person</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text className="text-text-secondary text-sm leading-relaxed mb-6">
            Nominate someone who looks out for you — a partner, sponsor, or
            friend with the app. They see four simple signals about your day,
            never your journals, messages, or conversations. End it any time.
          </Text>

          {/* Invite */}
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-white/8">
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
              Nominate someone
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Their exact username"
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
              title={inviting ? 'Inviting…' : 'Invite'}
              variant="primary"
              size="md"
              fullWidth
              loading={inviting}
              onPress={handleInvite}
            />
          </View>

          {/* My trusted people */}
          {!!mine?.length && (
            <View className="mb-6">
              <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
                Looking out for you
              </Text>
              {mine.map((l) => (
                <View
                  key={l.id}
                  className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3 mb-2 border border-white/5"
                >
                  <Avatar username={l.otherUsername} size="sm" />
                  <View className="flex-1">
                    <Text className="text-text-primary text-sm font-medium">
                      {l.otherUsername}
                    </Text>
                    <Text className="text-text-muted text-xs capitalize">{l.status}</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Remove?', `${l.otherUsername} will stop seeing your signals.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => remove(l.id) },
                      ])
                    }
                    hitSlop={12}
                  >
                    <Text className="text-text-muted text-base">×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Invites for me to accept */}
          {pendingForMe.map((l) => (
            <Animated.View
              key={l.id}
              entering={FadeInDown.duration(300)}
              className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/10"
            >
              <Text className="text-text-primary text-base font-semibold mb-1">
                {l.otherUsername} trusts you.
              </Text>
              <Text className="text-text-muted text-sm mb-4 leading-relaxed">
                They'd like you to see simple daily wellbeing signals — never
                their private content.
              </Text>
              <View className="flex-row gap-2">
                <Button title="Decline" variant="secondary" size="sm" className="flex-1"
                  onPress={() => respond({ linkId: l.id, accept: false })} />
                <Button title="Accept" variant="primary" size="sm" className="flex-1"
                  onPress={() => respond({ linkId: l.id, accept: true })} />
              </View>
            </Animated.View>
          ))}

          {/* People I watch over */}
          {!!acceptedForMe.length && (
            <View className="mt-2">
              <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
                People you look out for
              </Text>
              {acceptedForMe.map((l) => (
                <SignalsCard key={l.id} link={l} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
