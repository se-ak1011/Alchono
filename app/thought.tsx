import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { useDilemmas, type Dilemma } from '@/hooks/useDilemmas';
import { FOOD } from '@/lib/food';
import { headingShadow } from '@/styles';

const S = FOOD.thought;

function Wash() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}>
      <LinearGradient
        colors={[S.wash, 'rgba(138,178,174,0.06)', 'rgba(32,29,40,0)']}
        locations={[0, 0.45, 1]}
        style={{ flex: 1 }}
      />
    </View>
  );
}

function DilemmaCard({ item, i, onPress }: { item: Dilemma; i: number; onPress: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(320).delay(Math.min(i * 45, 360))}>
      <Pressable
        onPress={onPress}
        className="bg-surface rounded-3xl px-5 py-5 mb-3 border border-white/8 active:border-white/20"
      >
        <Text className="text-text-primary text-lg font-semibold leading-snug">{item.title}</Text>
        <Text className="text-text-secondary text-sm leading-relaxed mt-2" numberOfLines={3}>
          {item.story}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-3">
          <Text style={{ color: S.accent, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
            What do you think?
          </Text>
          <Feather name="chevron-right" size={15} color={S.accent} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ThoughtScreen() {
  const router = useRouter();
  const { data: dilemmas = [], isLoading } = useDilemmas();

  return (
    <SafeArea>
      <Wash />
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 32 }}>
            {S.title}
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            No right answer — just a moment to weigh it up.
          </Text>
        </View>
      </View>

      <FlatList
        data={dilemmas}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <DilemmaCard
            item={item}
            i={index}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/thought/[id]', params: { id: item.id } });
            }}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center px-10 mt-24">
              <Text className="text-text-secondary text-base text-center leading-relaxed">
                New dilemmas are on the way.
              </Text>
              <Text className="text-text-muted text-sm text-center leading-relaxed mt-2">
                Check back in a little while.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeArea>
  );
}
