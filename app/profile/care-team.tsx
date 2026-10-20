import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { DrawnForm, AreaZone, type Rect } from '@/components/paper/DrawnForm';
import { useAuthStore } from '@/store/authStore';
import { useMyCareTeam, useRespondToCareRequest } from '@/hooks/usePro';

/**
 * The Care Team closeup — the wallet card from the chest. The explanation + the
 * "scanning only lets them ask" line now live in the art; this mounts the QR +
 * username on the card face and the incoming requests / approved pros below, as
 * positionable zones for the pencil editor. Same logic as before.
 */
const CARD = require('../../assets/scenes/careteam_card.webp');
const INK = '#332a24';
const CREAM = '#ECE6D6';
const CREAM_SOFT = 'rgba(236,230,214,0.6)';
const HAND = 'PatrickHand';

const R = {
  ct_qr: { x: 0.36, y: 0.42, w: 0.42, h: 0.26 } as Rect,
  ct_list: { x: 0.06, y: 0.72, w: 0.88, h: 0.26 } as Rect,
} as const;

export default function CareTeamScreen() {
  const router = useRouter();
  const username = useAuthStore((s) => s.profile?.username);
  const { data: links } = useMyCareTeam();
  const { mutate: respond } = useRespondToCareRequest();

  const pending = (links ?? []).filter((l) => l.status === 'pending');
  const accepted = (links ?? []).filter((l) => l.status === 'accepted');

  return (
    <View style={{ flex: 1, backgroundColor: '#2a1430' }}>
      <DrawnForm source={CARD} label="careteam-card" tint="light" onBack={() => router.back()}>
        {/* QR + username — on the card's square. */}
        {!!username && (
          <AreaZone id="ct_qr" rect={R.ct_qr}>
            <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10 }}>
                <QRCode value={`alchono://pro/add/${username}`} size={120} />
              </View>
              <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginTop: 8, fontFamily: HAND }}>{username}</Text>
            </View>
          </AreaZone>
        )}

        {/* Requests + approved — below the card. */}
        <AreaZone id="ct_list" rect={R.ct_list}>
          <ScrollView showsVerticalScrollIndicator={false}>
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
        </AreaZone>
      </DrawnForm>
    </View>
  );
}
