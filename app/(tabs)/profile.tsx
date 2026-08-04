import React from 'react';
import { View, Text, Pressable, ScrollView, Image, Dimensions, type ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MiniSky } from '@/components/constellation/MiniSky';
import { useAfDays } from '@/hooks/useVictories';
import { useCompanion } from '@/hooks/useCompanion';
import { useAuthStore } from '@/store/authStore';

/**
 * Me — no longer a menu, but a *room you're in*: your companion in a dark 90s
 * bedroom at night, looking out a full-wall window. Your real constellation
 * lives in that window (fills in with every alcohol-free night), and the things
 * in the room are the way through — the bed, the lamp, the drawers, the photos.
 *
 * Same engine as The Bar: one baked-in scene per companion, sized to the screen
 * width, with hand-lettered links positioned on top. Two composition presets
 * (the tall 853×1844 rooms and the shorter 2:3 ones), tunable in one place.
 */

const SCREEN_W = Dimensions.get('window').width;

type Rect = { x: number; y: number; w: number; h: number }; // fractions of the image
type Label = { key: string; text: string; route: string; x: number; y: number }; // fractions (top-left-ish)

// Where the window glass sits, and where each object's label lands.
// Fractions of the displayed image, so they scale with any screen.
const TALL_WINDOW: Rect = { x: 0.36, y: 0.05, w: 0.60, h: 0.50 };
const TALL_LABELS: Label[] = [
  { key: 'sky', text: 'Your sky', route: '/(tabs)/insights', x: 0.52, y: 0.5 },
  { key: 'moments', text: 'Your moments', route: '/moments', x: 0.18, y: 0.33 },
  { key: 'goals', text: 'Looking forward to', route: '/goals', x: 0.06, y: 0.43 },
  { key: 'profile', text: 'Profile', route: '/account', x: 0.08, y: 0.56 },
  { key: 'tonight', text: 'Tonight', route: '/session/track', x: 0.22, y: 0.78 },
];

const SHORT_WINDOW: Rect = { x: 0.37, y: 0.05, w: 0.60, h: 0.55 };
const SHORT_LABELS: Label[] = [
  { key: 'sky', text: 'Your sky', route: '/(tabs)/insights', x: 0.55, y: 0.55 },
  { key: 'moments', text: 'Your moments', route: '/moments', x: 0.16, y: 0.32 },
  { key: 'goals', text: 'Looking forward to', route: '/goals', x: 0.05, y: 0.42 },
  { key: 'profile', text: 'Profile', route: '/account', x: 0.07, y: 0.60 },
  { key: 'tonight', text: 'Tonight', route: '/session/track', x: 0.16, y: 0.76 },
];

type Room = { src: ImageSourcePropType; w: number; h: number; window: Rect; labels: Label[] };

const ROOMS: Record<string, Room> = {
  kai:   { src: require('../../assets/scenes/kai_me.png'),   w: 853,  h: 1844, window: TALL_WINDOW,  labels: TALL_LABELS },
  yara:  { src: require('../../assets/scenes/yara_me.png'),  w: 853,  h: 1844, window: TALL_WINDOW,  labels: TALL_LABELS },
  amara: { src: require('../../assets/scenes/amara_me.png'), w: 852,  h: 1846, window: TALL_WINDOW,  labels: TALL_LABELS },
  marco: { src: require('../../assets/scenes/marco_me.png'), w: 1047, h: 1503, window: SHORT_WINDOW, labels: SHORT_LABELS },
  amos:  { src: require('../../assets/scenes/amos_me.png'),  w: 1060, h: 1484, window: SHORT_WINDOW, labels: SHORT_LABELS },
  rose:  { src: require('../../assets/scenes/rose_me.png'),  w: 1060, h: 1484, window: SHORT_WINDOW, labels: SHORT_LABELS },
};

function RoomLabel({ label, imgH, onPress }: { label: Label; imgH: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={16}
      accessibilityRole="button"
      accessibilityLabel={label.text}
      style={{ position: 'absolute', left: label.x * SCREEN_W, top: label.y * imgH }}
      className="active:opacity-70"
    >
      <Text
        style={{
          fontFamily: 'SkinnyCustard',
          fontSize: 22,
          lineHeight: 26,
          color: '#F0EBF5',
          textShadowColor: 'rgba(0,0,0,0.95)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 7,
        }}
      >
        {label.text}
      </Text>
    </Pressable>
  );
}

export default function MeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { companion } = useCompanion();
  const { data: dates = [] } = useAfDays();
  const userId = useAuthStore((s) => s.user?.id) ?? 'anon';

  const room = ROOMS[companion.id] ?? ROOMS.kai;
  const imgH = SCREEN_W * (room.h / room.w);

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const winW = room.window.w * SCREEN_W;
  const winH = room.window.h * imgH;

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ width: SCREEN_W, height: imgH, position: 'relative' }}>
          <Image source={room.src} style={{ width: SCREEN_W, height: imgH }} resizeMode="cover" />

          {/* The live constellation, dropped into the window glass. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: room.window.x * SCREEN_W,
              top: room.window.y * imgH,
              width: winW,
              height: winH,
              overflow: 'hidden',
            }}
          >
            <MiniSky dates={dates} userSeed={userId} width={winW} height={winH} />
          </View>

          {/* The objects, hand-lettered — each a way through. */}
          {room.labels.map((l) => (
            <RoomLabel key={l.key} label={l} imgH={imgH} onPress={() => go(l.route)} />
          ))}
        </View>
      </ScrollView>

      {/* A soft scrim so the header stays legible over the dark room. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(13,11,18,0.7)', 'rgba(13,11,18,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 70 }}
      />
      <View style={{ position: 'absolute', top: insets.top + 6, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'SkinnyCustard', fontSize: 30, color: '#ECE9F1' }}>Me</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Pressable onPress={() => go('/account')} hitSlop={12} className="p-2 active:opacity-60">
            <Feather name="user" size={21} color="#ECE9F1" />
          </Pressable>
          <Pressable onPress={() => go('/settings')} hitSlop={12} className="p-2 active:opacity-60">
            <Feather name="settings" size={21} color="#ECE9F1" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
