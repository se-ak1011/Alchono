import React from 'react';
import { View, Text, Pressable, FlatList, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { useCuratedStories, type CuratedStory } from '@/hooks/useCuratedStories';
import { FOOD } from '@/lib/food';

const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' }) as string;
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
const S = FOOD.giggles;
const PAPER = '#e9dfe4';
const INK = '#33262e';

function Wash() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}>
      <LinearGradient colors={[S.wash, 'rgba(214,161,132,0.06)', 'rgba(32,29,40,0)']} locations={[0, 0.45, 1]} style={{ flex: 1 }} />
    </View>
  );
}

/** A daft little story, clipped from the funny pages and taped up. */
function Strip({ item, i }: { item: CuratedStory; i: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(320).delay(Math.min(i * 55, 400))} style={{ transform: [{ rotate: i % 2 === 0 ? '0.8deg' : '-1deg' }] }}>
      <View style={{ marginBottom: 18 }}>
        {/* A strip of "tape" holding it to the page. */}
        <View style={{ position: 'absolute', top: -7, alignSelf: 'center', width: 58, height: 16, backgroundColor: 'rgba(236,233,241,0.16)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)', transform: [{ rotate: '-3deg' }], zIndex: 2 }} />
        <View style={{ backgroundColor: PAPER, borderRadius: 3, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(0,0,0,0.18)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } }}>
          <Text style={{ fontFamily: SERIF, fontWeight: '700', fontSize: 18, lineHeight: 23, color: INK }}>{item.title}</Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: 'rgba(0,0,0,0.76)', marginTop: 8, fontStyle: 'italic' }}>{item.body}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function GigglesScreen() {
  const router = useRouter();
  const { data: stories = [], isLoading } = useCuratedStories('giggle');

  return (
    <SafeArea>
      <Wash />
      <View className="px-6 pt-4 pb-2 flex-row items-start gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#817B91' }}>FOOD FOR THE GIGGLES</Text>
          <Text style={{ fontFamily: SERIF, fontWeight: '700', fontSize: 30, lineHeight: 34, color: '#ECE9F1', marginTop: 3 }}>
            The Funny Pages
          </Text>
          <Text style={{ color: '#817B91', fontSize: 13, marginTop: 4 }}>Not taking it all so seriously.</Text>
        </View>
      </View>

      <FlatList
        data={stories}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <Strip item={item} i={index} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ fontFamily: MONO, fontSize: 13, color: '#817B91', textAlign: 'center', marginTop: 60, paddingHorizontal: 32, lineHeight: 21 }}>
              // the cartoonist is still chuckling at their own joke —{'\n'}fresh giggles on the way.
            </Text>
          ) : null
        }
      />
    </SafeArea>
  );
}
