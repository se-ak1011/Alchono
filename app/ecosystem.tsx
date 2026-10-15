import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import * as Haptics from 'expo-haptics';
import { headingShadow } from '@/styles';

/**
 * "The Grounds" — the directory behind the shared reception. Each room is a
 * sibling app for a different thing people get stuck on; the door colours here
 * match the doors in the reception scene. Alcohol (this app) is live; the rest
 * are in the works — each row becomes a store link the day its app ships.
 */
type Room = { name: string; color: string; note: string };

// Colours match the reception doors.
const ROOMS: Room[] = [
  { name: 'Cannabis', color: '#5FA463', note: 'Cannano · in the works' },
  { name: 'Nicotine', color: '#D08A4E', note: 'Nicono · in the works' },
  { name: 'Cocaine', color: '#E8E0CF', note: 'Cocano · in the works' },
  { name: 'Prescription medication', color: '#4FA0A8', note: 'Medano · in the works' },
];

export default function EcosystemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const comingSoon = (room: Room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      `${room.name} — ${room.note}`,
      'This room is being built. When it opens it will work exactly like Alchono: private, judgement-free, yours — just for a different thing.',
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#201D28', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ZoneGlow zone="me" intensity={0.55} />
      <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center gap-4 px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className="text-text-muted text-sm font-semibold tracking-[4px] uppercase mt-4">Reception</Text>
          <Text className="text-text-primary text-3xl font-semibold tracking-tight mt-1 mb-4" style={headingShadow}>
            The Grounds
          </Text>
          <Text className="text-text-secondary text-base leading-relaxed mb-8">
            Every door here is a different thing people get stuck on. You're allowed through more than one — struggling with two things doesn't make you twice as broken, it makes you human. Take whichever rooms you need.
          </Text>

          {/* You are here. */}
          <View className="bg-surface rounded-2xl px-5 py-4 mb-8 border border-white/8">
            <View className="flex-row items-center gap-3">
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#A489DE' }} />
              <View className="flex-1">
                <Text className="text-text-primary text-base font-semibold">Alcohol</Text>
                <Text className="text-text-muted text-sm mt-0.5">You're here. This is Alchono.</Text>
              </View>
              <Text className="text-accent text-base">✓</Text>
            </View>
          </View>

          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">Other rooms</Text>
          <View style={{ gap: 8 }}>
            {ROOMS.map((room, i) => (
              <Animated.View key={room.name} entering={FadeInDown.duration(300).delay(Math.min(i * 50, 300))}>
                <Pressable
                  onPress={() => comingSoon(room)}
                  className="flex-row items-center gap-3 bg-surface rounded-2xl px-5 py-4 border border-white/5 active:border-white/15"
                >
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: room.color }} />
                  <Text className="text-text-secondary text-base font-medium flex-1">{room.name}</Text>
                  <Text className="text-text-muted text-xs">{room.note.includes('works') ? 'building' : 'soon'}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Text className="text-text-muted text-sm leading-relaxed mt-8">
            One way of working, every room: no lectures, no judgement, no selling your data. As each one opens, it appears here. 🤍
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
