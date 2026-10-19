import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { DrawnForm, TickZone, AreaZone, type Rect } from '@/components/paper/DrawnForm';
import { useAuthStore } from '@/store/authStore';

/**
 * The chest — your most private connections. The wax-sealed SPONSOR envelope and
 * the CARE TEAM card; tapping either opens its closeup. Now a DrawnForm so the
 * two tap regions and the little QR preview can be positioned over the art in
 * the pencil editor, then exported + baked.
 */
const CHEST = require('../../assets/scenes/chest.webp');

const R = {
  c_sponsor: { x: 0.03, y: 0.42, w: 0.56, h: 0.38 } as Rect,
  c_careteam: { x: 0.6, y: 0.48, w: 0.38, h: 0.16 } as Rect,
  c_qr: { x: 0.76, y: 0.5, w: 0.16, h: 0.09 } as Rect,
} as const;

export default function ConnectionsScreen() {
  const router = useRouter();
  const username = useAuthStore((s) => s.profile?.username);
  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#2a1430' }}>
      <DrawnForm source={CHEST} label="chest" tint="light" onBack={() => router.back()}>
        <LinkZone id="c_sponsor" rect={R.c_sponsor} onPress={() => go('/profile/trusted')} />
        <LinkZone id="c_careteam" rect={R.c_careteam} onPress={() => go('/profile/care-team')} />
        {!!username && (
          <AreaZone id="c_qr" rect={R.c_qr}>
            <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ backgroundColor: '#fff', padding: 4, borderRadius: 5 }}>
                <QRCode value={`alchono://pro/add/${username}`} size={48} />
              </View>
            </View>
          </AreaZone>
        )}
      </DrawnForm>
    </View>
  );
}

/** An invisible tap over a drawn object. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return <TickZone id={id} rect={rect} value={false} onToggle={onPress} />;
}
