import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { PaperCanvas, Placeable } from '@/components/paper/PaperCanvas';

const INK = '#332a24';
const INK_SOFT = 'rgba(51,42,36,0.55)';

type Row = { title: string; subtitle: string; route: string; icon: keyof typeof Feather.glyphMap; accent: string };

// Steady, not-a-crisis support. Deliberately NOT the things that now live
// elsewhere (progress in Me, milestones in the timeline, mentors in Community) —
// this slot is the proactive, plan-ahead corner.
const ROWS: Row[] = [
  { title: 'My plan', subtitle: 'Your reasons, people and go-to moves — written calmly, for a harder moment later.', route: '/plan', icon: 'clipboard', accent: '#7b5fc0' },
  { title: 'After a slip', subtitle: 'Get back up, no shame. A gentle way through the day after.', route: '/toolkit/c/after-a-slip', icon: 'refresh-ccw', accent: '#5a8a4e' },
  { title: 'Share with your GP', subtitle: 'A clean summary and drinks diary to print or email to a professional.', route: '/summary', icon: 'file-text', accent: '#8a7440' },
  { title: 'Resources', subtitle: 'Helplines, meetings, and support services.', route: '/support/resources', icon: 'life-buoy', accent: '#6b4f8f' },
];

export default function RecoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <PaperBackground>
      <PaperCanvas label="Recovery">
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 26, paddingTop: 6, paddingBottom: 2 }}>
            <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
              <Feather name="chevron-left" size={26} color={INK} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 30, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            <Placeable id="title" def={{ dx: 0.234, dy: -0.002 }}>
              <Text style={{ fontFamily: 'PatrickHand', fontSize: 34, color: INK, marginTop: 6, marginBottom: 1 }}>Recovery</Text>
            </Placeable>
            <Placeable id="subtitle" def={{ dx: 0.034, dy: 0.015 }}>
              <Text style={{ color: INK_SOFT, fontSize: 15, lineHeight: 21, marginBottom: 16 }}>
                Not a hard moment — just here. Take your time.
              </Text>
            </Placeable>

            <Placeable id="list">
              <View>
                {ROWS.map((r, i) => (
                  <Animated.View key={r.title} entering={FadeInDown.duration(400).delay(80 + i * 60)}>
                    <Pressable
                      onPress={() => router.push(r.route as any)}
                      className="active:opacity-70"
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(51,42,36,0.14)' }}
                    >
                      <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51,42,36,0.06)' }}>
                        <Feather name={r.icon} size={18} color={r.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'PatrickHand', fontSize: 19, color: INK }}>{r.title}</Text>
                        <Text style={{ color: INK_SOFT, fontSize: 12.5, lineHeight: 17 }}>{r.subtitle}</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={INK_SOFT} />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Placeable>
          </ScrollView>
        </View>
      </PaperCanvas>
    </PaperBackground>
  );
}
