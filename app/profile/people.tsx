import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

type Row = {
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
  tint: string;
};

// The break-room table's "Care Team & Trusted Person" — your human safety net,
// held together on one page. Each opens the fuller screen.
const ROWS: Row[] = [
  {
    title: 'Care team',
    subtitle: 'Counsellors or recovery professionals you let see your trends — approved by you, revoked any time.',
    route: '/profile/care-team',
    icon: 'shield',
    tint: '#8B7BD8',
  },
  {
    title: 'Trusted person',
    subtitle: 'The one or two people you want close by — who you can reach fast on a hard night.',
    route: '/profile/trusted',
    icon: 'heart',
    tint: '#C77BA6',
  },
];

export default function PeopleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScreenHeader title="Your people" subtitle="Care team & trusted person." />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {ROWS.map((r, i) => (
          <Animated.View key={r.title} entering={FadeInDown.duration(400).delay(80 + i * 80)}>
            <Pressable
              onPress={() => router.push(r.route as any)}
              className="flex-row items-center gap-4 bg-surface rounded-2xl px-5 py-5 mb-3 border border-white/8 active:opacity-80"
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <Feather name={r.icon} size={20} color={r.tint} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-lg font-semibold">{r.title}</Text>
                <Text className="text-text-muted text-sm leading-relaxed mt-0.5">{r.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6b6676" />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
