import React from 'react';
import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AiCoachChat } from '@/components/support/AiCoachChat';

/**
 * AI Coach — you step into the lounge and sit down for a talk. The room is a
 * fixed backdrop and the conversation lives over the lower half (a scrim keeps
 * the text readable). Same flat as Support/Me; here you've walked through to
 * the quiet room.
 */

const SCREEN_W = Dimensions.get('window').width;
const ROOM = require('../../assets/scenes/coach_room.png');
const ROOM_W = 853;
const ROOM_H = 1844;
const IMG_H = SCREEN_W * (ROOM_H / ROOM_W);

export default function CoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      {/* The library, fixed behind the conversation. */}
      <Image
        source={ROOM}
        style={{ position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: IMG_H }}
        resizeMode="cover"
      />
      {/* Scrim so the conversation stays legible over the lower room. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(13,11,18,0)', 'rgba(13,11,18,0.55)', 'rgba(13,11,18,0.9)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: IMG_H * 0.42 }}
      />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View className="flex-row items-center gap-4 px-6 pt-2 pb-3">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: '#ECE9F1', fontSize: 18 }}>←</Text>
          </Pressable>
          <Text style={{ fontFamily: 'PatrickHand', fontSize: 28, color: '#ECE9F1' }}>AI Coach</Text>
        </View>
        <View className="flex-1">
          <AiCoachChat hideCompanion />
        </View>
      </View>
    </View>
  );
}
