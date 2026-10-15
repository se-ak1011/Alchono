import React from 'react';
import * as Haptics from 'expo-haptics';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { DrawnForm, TickZone, type Rect } from '@/components/paper/DrawnForm';

/**
 * Recovery — Marta's hand-drawn drawer, opened from the drawers around the
 * house. The steady, not-a-crisis corner, laid out as objects you reach for:
 *   • the folded "For when it gets hard" note  → My Plan (its own close-up)
 *   • the "Useful People" notebook (Call/Text/Meetings) → the resources
 *   • the "Take to GP" envelope → the shareable summary / export
 * Zones carry rough default rects; position them with the pencil editor and
 * Export, same art→coordinates workflow as the rooms and the Personal File.
 */

const recoveryDrawer = require('../../assets/folder/recovery-drawer.png');

// Rough default rects — drag + Export exact positions in the editor.
const R = {
  rec_plan: { x: 0.04, y: 0.31, w: 0.55, h: 0.40 } as Rect,      // folded "For when it gets hard"
  rec_resources: { x: 0.55, y: 0.22, w: 0.38, h: 0.28 } as Rect, // "Useful People" notebook
  rec_gp: { x: 0.33, y: 0.52, w: 0.62, h: 0.21 } as Rect,        // "Take to GP" envelope
} as const;

export default function RecoveryScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <DrawnForm source={recoveryDrawer} label="recovery-drawer" onBack={() => router.back()}>
        {/* My Plan — routes to the existing screen for now; becomes a nested
            close-up (4 FieldZones over recovery_plan) when its art lands. */}
        <LinkZone id="rec_plan" rect={R.rec_plan} onPress={() => router.push('/plan')} />
        <LinkZone id="rec_resources" rect={R.rec_resources} onPress={() => router.push('/resources/home' as any)} />
        <LinkZone id="rec_gp" rect={R.rec_gp} onPress={() => router.push('/summary' as any)} />
      </DrawnForm>
    </View>
  );
}

/** A tappable object — invisible over the drawn note / notebook / envelope. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return (
    <TickZone id={id} rect={rect} value={false} onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} />
  );
}
