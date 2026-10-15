import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getArcadeGame } from '@/data/arcadeGames';

/**
 * An arcade cabinet's screen — the chosen game's self-contained HTML, run in a
 * WebView over the whole screen. Reached from a device hotspot in the arcade
 * (/arcade/<slug>). The back chevron (top-left) exits to the arcade room.
 */
export default function ArcadeGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { game } = useLocalSearchParams<{ game: string }>();
  const g = getArcadeGame(game);

  return (
    <View style={{ flex: 1, backgroundColor: '#1f1430' }}>
      {g ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: g.html }}
          style={{ flex: 1, backgroundColor: '#1f1430' }}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ECE6D6', fontFamily: 'PatrickHand', fontSize: 18 }}>Game not found</Text>
        </View>
      )}

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Leave the game"
        style={{ position: 'absolute', top: insets.top + 8, left: 16, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,11,18,0.6)', borderWidth: 1, borderColor: 'rgba(192,132,252,0.5)' }}
      >
        <Feather name="chevron-left" size={24} color="#e9d5ff" />
      </Pressable>
    </View>
  );
}
