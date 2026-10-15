import React from 'react';
import { View, Text, Pressable, ImageBackground, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '@/store/authStore';

/**
 * The chest — your most private connections, kept safe. The wax-sealed SPONSOR
 * envelope and the CARE TEAM wallet card. Tapping either opens its closeup.
 * Reached when both show up together (e.g. the Break Room "Care Team & Trusted
 * Person" wall); the Me Room links straight to each closeup instead.
 */
const CHEST = require('../../assets/scenes/chest.webp');

export default function ConnectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const username = useAuthStore((s) => s.profile?.username);
  const qr = Math.min(W * 0.14, 64);

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <ImageBackground source={CHEST} style={{ flex: 1, backgroundColor: '#2a1430' }} resizeMode="cover">
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(236,230,214,0.12)' }}>
        <Feather name="chevron-left" size={24} color="#ECE6D6" />
      </Pressable>

      {/* SPONSOR envelope → closeup */}
      <Pressable onPress={() => go('/profile/trusted')} style={{ position: 'absolute', left: '3%', top: '42%', width: '56%', height: '38%' }} accessibilityRole="button" accessibilityLabel="Sponsor" />

      {/* CARE TEAM card → closeup (with a live QR preview on the card) */}
      <Pressable onPress={() => go('/profile/care-team')} style={{ position: 'absolute', left: '60%', top: '48%', width: '38%', height: '16%' }} accessibilityRole="button" accessibilityLabel="Care team" />
      {!!username && (
        <View pointerEvents="none" style={{ position: 'absolute', left: W * 0.76, top: H * 0.515 }}>
          <View style={{ backgroundColor: '#fff', padding: 4, borderRadius: 5 }}>
            <QRCode value={`alchono://pro/add/${username}`} size={qr} />
          </View>
        </View>
      )}
    </ImageBackground>
  );
}
