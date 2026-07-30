import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { ZoneChip } from '@/components/ui/ZoneChip';
import { headingShadow } from '@/styles';

type Row = { title: string; subtitle: string; route: string; icon: keyof typeof Feather.glyphMap; accent: string };

// Steady, not-a-crisis support. Deliberately NOT the things that now live
// elsewhere (progress in Me, milestones in the timeline, mentors in Community) —
// this slot is the proactive, plan-ahead corner.
const ROWS: Row[] = [
  {
    title: 'My plan',
    subtitle: 'Your reasons, people and go-to moves — written calmly, for a harder moment later.',
    route: '/plan',
    icon: 'clipboard',
    accent: '#B9A4EC',
  },
  {
    title: 'After a slip',
    subtitle: 'Get back up, no shame. A gentle way through the day after.',
    route: '/toolkit/c/after-a-slip',
    icon: 'refresh-ccw',
    accent: '#A9D19E',
  },
  {
    title: 'Share with your GP',
    subtitle: 'A clean summary and drinks diary to print or email to a professional.',
    route: '/summary',
    icon: 'file-text',
    accent: '#C7B58A',
  },
  {
    title: 'Resources',
    subtitle: 'Helplines, meetings, and support services.',
    route: '/support/resources',
    icon: 'life-buoy',
    accent: '#A082BE',
  },
];

export default function RecoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ZoneGlow zone="support" intensity={0.55} />
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center gap-4 px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text
            className="text-text-primary text-4xl font-semibold tracking-tight leading-tight mt-6 mb-3"
            style={headingShadow}
          >
            Recovery
          </Text>
          <Text className="text-text-secondary text-lg leading-relaxed mb-8">
            Not a hard moment — just here. Take your time.
          </Text>

          {ROWS.map((r, i) => (
            <Animated.View
              key={r.title}
              entering={FadeInDown.duration(400).delay(100 + i * 60)}
            >
              <ZoneChip
                icon={r.icon}
                accent={r.accent}
                title={r.title}
                subtitle={r.subtitle}
                onPress={() => router.push(r.route as any)}
              />
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
