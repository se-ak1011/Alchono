import React from 'react';
import { View, Text, Pressable, FlatList, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { useGoodNews, type GoodNewsItem } from '@/hooks/useGoodNews';

const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' }) as string;
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
const PAPER = '#e7e1d2';
const INK = '#2b2620';

function Wash() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}>
      <LinearGradient colors={['rgba(199,181,138,0.20)', 'rgba(199,181,138,0.06)', 'rgba(32,29,40,0)']} locations={[0, 0.45, 1]} style={{ flex: 1 }} />
    </View>
  );
}

/** A good-news story, as a clipping torn from the Gazette. */
function Clipping({ item, i }: { item: GoodNewsItem; i: number }) {
  const lead = i === 0;
  return (
    <Animated.View entering={FadeInDown.duration(320).delay(Math.min(i * 55, 400))} style={{ transform: [{ rotate: i % 2 === 0 ? '-0.5deg' : '0.5deg' }] }}>
      <View style={{ backgroundColor: PAPER, borderRadius: 3, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 17, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 9, shadowOffset: { width: 0, height: 5 } }}>
        <Text style={{ fontFamily: SERIF, fontWeight: '700', fontSize: lead ? 22 : 18, lineHeight: lead ? 27 : 23, color: INK }}>
          {item.title}
        </Text>
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.22)', marginTop: 9, marginBottom: 10 }} />
        <Text style={{ fontFamily: SERIF, fontSize: 15, lineHeight: 22, color: 'rgba(0,0,0,0.78)' }}>
          {item.summary}
        </Text>
        {item.source ? (
          <Text style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: 'rgba(0,0,0,0.5)', marginTop: 12 }}>
            — {item.source.toUpperCase()}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function SoulScreen() {
  const router = useRouter();
  const { data: items = [], isLoading } = useGoodNews();
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeArea>
      <Wash />
      <View className="px-6 pt-4 pb-2 flex-row items-start gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#817B91' }}>FOOD FOR THE SOUL</Text>
          <Text style={{ fontFamily: SERIF, fontWeight: '700', fontSize: 30, lineHeight: 34, color: '#ECE9F1', marginTop: 3 }}>
            The Good News Gazette
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(236,233,241,0.18)' }} />
            <Text style={{ fontFamily: MONO, fontSize: 10, color: '#817B91' }}>{today} · free</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(236,233,241,0.18)' }} />
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it, i) => `${it.title}-${i}`}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <Clipping item={item} i={index} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ fontFamily: MONO, fontSize: 13, color: '#817B91', textAlign: 'center', marginTop: 60, paddingHorizontal: 32, lineHeight: 21 }}>
              // tomorrow’s edition is still at the printers —{'\n'}check back in a little while.
            </Text>
          ) : null
        }
      />
    </SafeArea>
  );
}
