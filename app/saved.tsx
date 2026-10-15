import React from 'react';
import { View, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { DrawnForm, TickZone, type Rect } from '@/components/paper/DrawnForm';

/**
 * Saved — Marta's hand-drawn filing drawer in the Me room. A personal stash of
 * favourites, one folder per kind: Articles, Games, Moments & posts, Drinks &
 * recommendations. Favourite anything anywhere in the app and it gathers in its
 * folder here, so the thing that helps is one tap away without leaving the room.
 *
 * The save/favourite system (a toggle on each savable item + real rows) is the
 * next feature; until then each folder gives a gentle empty-state. Zones carry
 * rough default rects — position with the pencil editor + Export.
 */

const savedDrawer = require('../assets/folder/saved-drawer.png');

const R = {
  sv_articles: { x: 0.20, y: 0.325, w: 0.46, h: 0.055 } as Rect,
  sv_games: { x: 0.20, y: 0.405, w: 0.46, h: 0.055 } as Rect,
  sv_moments: { x: 0.20, y: 0.480, w: 0.50, h: 0.055 } as Rect,
  sv_drinks: { x: 0.20, y: 0.555, w: 0.54, h: 0.060 } as Rect,
} as const;

export default function SavedScreen() {
  const router = useRouter();
  const empty = (kind: string) =>
    Alert.alert('Nothing saved here yet', `Favourite ${kind} anywhere in the app and it’ll gather in this folder.`);

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <DrawnForm source={savedDrawer} label="saved-drawer" onBack={() => router.back()}>
        <LinkZone id="sv_articles" rect={R.sv_articles} onPress={() => empty('an article from the Reading Corner')} />
        <LinkZone id="sv_games" rect={R.sv_games} onPress={() => empty('a game from the Arcade')} />
        <LinkZone id="sv_moments" rect={R.sv_moments} onPress={() => empty('a moment or a community post')} />
        <LinkZone id="sv_drinks" rect={R.sv_drinks} onPress={() => empty('a drink or a recommendation')} />
      </DrawnForm>
    </View>
  );
}

/** A tappable folder tab — invisible over the drawn label. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return (
    <TickZone id={id} rect={rect} value={false} onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} />
  );
}
