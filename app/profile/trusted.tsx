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
  ImageBackground,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

/**
 * The Sponsor closeup — the wax-sealed invitation slip from the chest. Someone
 * you nominate to look out for you; they see four simple daily signals, never
 * your private content. Same logic as before, mounted on the drawn slip in ink.
 */
const SLIP = require('../../assets/scenes/sponsor_slip.webp');
const INK = '#332a24';
const INK_SOFT = 'rgba(51,42,36,0.55)';
const HAND = 'PatrickHand';

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: INK_SOFT, fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{children}</Text>;
}

function InkButton({ title, onPress, loading, muted }: { title: string; onPress: () => void; loading?: boolean; muted?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={{ borderRadius: 10, paddingVertical: 11, alignItems: 'center', backgroundColor: muted ? 'transparent' : '#4a2545', borderWidth: 1, borderColor: muted ? 'rgba(51,42,36,0.3)' : '#4a2545' }}>
      <Text style={{ color: muted ? INK : '#f3ead6', fontSize: 15, fontWeight: '700', fontFamily: HAND }}>{loading ? 'Inviting…' : title}</Text>
    </Pressable>
  );
}

function SignalChip({ on, label, tone }: { on: boolean; label: string; tone: 'good' | 'warn' | 'alert' }) {
  const bg = !on ? 'rgba(51,42,36,0.06)' : tone === 'good' ? 'rgba(74,120,80,0.16)' : tone === 'warn' ? 'rgba(200,160,70,0.18)' : 'rgba(180,70,70,0.18)';
  const bd = !on ? 'rgba(51,42,36,0.18)' : tone === 'good' ? 'rgba(74,120,80,0.5)' : tone === 'warn' ? 'rgba(200,160,70,0.6)' : 'rgba(180,70,70,0.6)';
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, backgroundColor: bg, borderColor: bd }}>
      <Text style={{ color: on ? INK : INK_SOFT, fontSize: 13, fontFamily: HAND }}>{label}</Text>
    </View>
  );
}

function SignalsCard({ link }: { link: TrustedLink }) {
  const { data: signals } = useTrustedSignals(link.id);
  return (
    <View style={{ backgroundColor: 'rgba(51,42,36,0.05)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(51,42,36,0.14)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar username={link.otherUsername} size="sm" />
        <Text style={{ color: INK, fontSize: 15, fontWeight: '700', flex: 1, fontFamily: HAND }}>{link.otherUsername}</Text>
        <Text style={{ color: INK_SOFT, fontSize: 12 }}>today</Text>
      </View>
      {signals ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <SignalChip on={signals.checked_in_today} tone="good" label={signals.checked_in_today ? '✅ Checked in' : '— No check-in yet'} />
          <SignalChip on={signals.urge_beaten_today} tone="good" label={signals.urge_beaten_today ? '✅ Got through a hard moment' : '— None logged yet'} />
          <SignalChip on={signals.rough_day} tone="warn" label={signals.rough_day ? '🟡 Rough day' : '— Mood steady'} />
          <SignalChip on={signals.asked_for_support} tone="alert" label={signals.asked_for_support ? '🔴 Reached for support' : '— No SOS'} />
        </View>
      ) : (
        <Text style={{ color: INK_SOFT, fontSize: 14 }}>Loading…</Text>
      )}
      {signals?.asked_for_support && (
        <Text style={{ color: INK, fontSize: 14, marginTop: 10, lineHeight: 20, fontFamily: HAND }}>Now's a good moment for a call or a knock on the door.</Text>
      )}
    </View>
  );
}

export default function SponsorScreen() {
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
        Alert.alert('Invited', 'They can accept from their own chest.');
      },
      onError: (e) => Alert.alert('Could not invite', e instanceof Error ? e.message : 'Try again.'),
    });
  };

  return (
    <ImageBackground source={SLIP} style={{ flex: 1, backgroundColor: '#2a1430' }} resizeMode="cover">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51,42,36,0.08)' }}>
          <Feather name="chevron-left" size={24} color={INK} />
        </Pressable>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: '10%', paddingTop: insets.top + 110, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={{ color: INK, fontSize: 30, fontFamily: HAND, marginBottom: 6 }}>Sponsor</Text>
          <Text style={{ color: INK, fontSize: 15, lineHeight: 22, marginBottom: 22, fontFamily: HAND }}>
            Nominate someone who looks out for you — a partner, sponsor, or friend with the app. They see four simple signals about your day, never your journals, messages, or conversations. End it any time.
          </Text>

          <Label>Nominate someone</Label>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Their exact username"
            placeholderTextColor={INK_SOFT}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ borderBottomWidth: 1.5, borderColor: 'rgba(51,42,36,0.35)', paddingVertical: 8, color: INK, fontSize: 17, fontFamily: HAND, marginBottom: 14 }}
          />
          <InkButton title="Invite" onPress={handleInvite} loading={inviting} />

          {!!mine?.length && (
            <View style={{ marginTop: 26 }}>
              <Label>Looking out for you</Label>
              {mine.map((l) => (
                <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(51,42,36,0.05)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(51,42,36,0.12)' }}>
                  <Avatar username={l.otherUsername} size="sm" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: INK, fontSize: 15, fontFamily: HAND }}>{l.otherUsername}</Text>
                    <Text style={{ color: INK_SOFT, fontSize: 12, textTransform: 'capitalize' }}>{l.status}</Text>
                  </View>
                  <Pressable
                    onPress={() => Alert.alert('Remove?', `${l.otherUsername} will stop seeing your signals.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => remove(l.id) }])}
                    hitSlop={12}
                  >
                    <Feather name="x" size={18} color={INK_SOFT} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {pendingForMe.map((l) => (
            <Animated.View key={l.id} entering={FadeInDown.duration(300)} style={{ backgroundColor: 'rgba(51,42,36,0.05)', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, marginTop: 14, borderWidth: 1, borderColor: 'rgba(51,42,36,0.16)' }}>
              <Text style={{ color: INK, fontSize: 16, fontWeight: '700', marginBottom: 4, fontFamily: HAND }}>{l.otherUsername} trusts you.</Text>
              <Text style={{ color: INK, fontSize: 14, marginBottom: 14, lineHeight: 20, fontFamily: HAND }}>They'd like you to see simple daily wellbeing signals — never their private content.</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><InkButton title="Decline" muted onPress={() => respond({ linkId: l.id, accept: false })} /></View>
                <View style={{ flex: 1 }}><InkButton title="Accept" onPress={() => respond({ linkId: l.id, accept: true })} /></View>
              </View>
            </Animated.View>
          ))}

          {!!acceptedForMe.length && (
            <View style={{ marginTop: 22 }}>
              <Label>People you look out for</Label>
              {acceptedForMe.map((l) => <SignalsCard key={l.id} link={l} />)}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
