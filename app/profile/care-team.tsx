import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, ImageBackground, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useAuthStore } from '@/store/authStore';
import { useMyCareTeam, useRespondToCareRequest } from '@/hooks/usePro';

/**
 * The Care Team closeup — the wallet card from the chest. The QR a counsellor
 * scans to ASK (nothing shared until approved). QR + username sit on the card
 * face; incoming requests and approved pros manage below on the velvet. Same
 * logic as before.
 */
const CARD = require('../../assets/scenes/careteam_card.webp');
const INK = '#332a24';
const CREAM = '#ECE6D6';
const CREAM_SOFT = 'rgba(236,230,214,0.6)';
const HAND = 'PatrickHand';

export default function CareTeamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const username = useAuthStore((s) => s.profile?.username);
  const { data: links } = useMyCareTeam();
  const { mutate: respond } = useRespondToCareRequest();

  const pending = (links ?? []).filter((l) => l.status === 'pending');
  const accepted = (links ?? []).filter((l) => l.status === 'accepted');
  const qrSize = Math.min(W * 0.34, 148);

  return (
    <ImageBackground source={CARD} style={{ flex: 1, backgroundColor: '#2a1430' }} resizeMode="cover">
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(236,230,214,0.12)' }}>
        <Feather name="chevron-left" size={24} color={CREAM} />
      </Pressable>

      {/* Intro — upper velvet, above the card */}
      <View style={{ position: 'absolute', top: insets.top + 60, left: 26, right: 26 }}>
        <Text style={{ color: CREAM, fontSize: 15, lineHeight: 22, fontFamily: HAND }}>
          Let a counsellor see your trends — check-ins, alcohol-free days, tough moments you got through. Never your journals, messages, or AI chats. You approve every link, and can revoke any time.
        </Text>
      </View>

      {/* QR + username — on the card face */}
      {!!username && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: H * 0.4, alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10 }}>
            <QRCode value={`alchono://pro/add/${username}`} size={qrSize} />
          </View>
          <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginTop: 8, fontFamily: HAND }}>{username}</Text>
          <Text style={{ color: 'rgba(51,42,36,0.6)', fontSize: 12, marginTop: 2, textAlign: 'center', paddingHorizontal: 30, lineHeight: 16, fontFamily: HAND }}>
            Scanning only lets them ask. Nothing's shared until you approve it.
          </Text>
        </View>
      )}

      {/* Requests + approved — lower velvet */}
      <ScrollView
        style={{ position: 'absolute', left: 0, right: 0, top: H * 0.67, bottom: 0 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {pending.map((l) => (
          <Animated.View key={l.id} entering={FadeInDown.duration(300)} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ color: CREAM, fontSize: 15, fontWeight: '700', marginBottom: 4, fontFamily: HAND }}>{l.otherUsername} is asking to see your trends.</Text>
            <Text style={{ color: CREAM_SOFT, fontSize: 13, marginBottom: 12, lineHeight: 19, fontFamily: HAND }}>A verified professional. If you don't know who this is, decline.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => respond({ linkId: l.id, status: 'declined' })} style={{ flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(236,230,214,0.3)' }}>
                <Text style={{ color: CREAM, fontSize: 14, fontWeight: '700', fontFamily: HAND }}>Decline</Text>
              </Pressable>
              <Pressable onPress={() => respond({ linkId: l.id, status: 'accepted' })} style={{ flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#4a2545' }}>
                <Text style={{ color: '#f3ead6', fontSize: 14, fontWeight: '700', fontFamily: HAND }}>Allow</Text>
              </Pressable>
            </View>
          </Animated.View>
        ))}

        {!!accepted.length && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: CREAM_SOFT, fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Can see your trends</Text>
            {accepted.map((l) => (
              <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                <Avatar username={l.otherUsername} size="sm" />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={{ color: CREAM, fontSize: 14, fontFamily: HAND }}>{l.otherUsername}</Text>
                  <RoleBadge role="counsellor" />
                </View>
                <Pressable
                  onPress={() => Alert.alert('Revoke access?', `${l.otherUsername} will immediately stop seeing your trends.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Revoke', style: 'destructive', onPress: () => respond({ linkId: l.id, status: 'revoked' }) }])}
                  hitSlop={10}
                >
                  <Text style={{ color: '#D99', fontSize: 14, fontFamily: HAND }}>Revoke</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}
