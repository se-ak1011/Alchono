import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { headingShadow } from '@/styles';
import { FOOD } from '@/lib/food';
import { useTodayCheckin } from '@/hooks/useCheckin';
import { useDilemmas } from '@/hooks/useDilemmas';
import { useCuratedStories } from '@/hooks/useCuratedStories';
import { useGoodNews } from '@/hooks/useGoodNews';

/**
 * Today — the finite daily ritual. One of each thing, presented as a short list
 * you can actually FINISH, then a genuine "you're all caught up" ending. The
 * deliberate anti-doomscroll surface: fresh, but with a bottom.
 */
function DailyCard({
  index,
  accent,
  kicker,
  title,
  body,
  onPress,
}: {
  index: number;
  accent: string;
  kicker: string;
  title: string;
  body?: string;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index * 60, 300))}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className="bg-surface rounded-3xl px-5 py-5 mb-3 border border-white/8 active:border-white/20"
      >
        <View className="flex-row items-center gap-2 mb-2">
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: accent }} />
          <Text style={{ color: accent, fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 }}>
            {kicker.toUpperCase()}
          </Text>
        </View>
        <Text className="text-text-primary text-lg font-semibold leading-snug">{title}</Text>
        {body ? (
          <Text className="text-text-secondary text-sm leading-relaxed mt-1.5" numberOfLines={2}>
            {body}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const { data: checkin } = useTodayCheckin();
  const { data: dilemmas = [], isLoading: dLoading } = useDilemmas('aita');
  const { data: giggles = [], isLoading: gLoading } = useCuratedStories('giggle');
  const { data: soul = [], isLoading: sLoading } = useGoodNews();

  const loading = dLoading || gLoading || sLoading;
  const dilemma = dilemmas[0];
  const giggle = giggles[0];
  const good = soul[0];

  return (
    <SafeArea>
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 32 }}>
            Today
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            A little to sit with. Then go live your day.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {!checkin ? (
          <DailyCard
            index={0}
            accent="#B9A4EC"
            kicker="Check in"
            title="How are you today?"
            body="A quiet moment for yourself before anything else."
            onPress={() => router.push('/checkin')}
          />
        ) : null}

        {dilemma ? (
          <DailyCard
            index={1}
            accent={FOOD.thought.accent}
            kicker="Food for Thought"
            title={dilemma.title}
            body={dilemma.story}
            onPress={() => router.push({ pathname: '/thought/[id]', params: { id: dilemma.id } })}
          />
        ) : null}

        {giggle ? (
          <DailyCard
            index={2}
            accent={FOOD.giggles.accent}
            kicker="Food for the Giggles"
            title={giggle.title}
            body={giggle.body}
            onPress={() => router.push('/giggles')}
          />
        ) : null}

        {good ? (
          <DailyCard
            index={3}
            accent={FOOD.soul.accent}
            kicker="Food for the Soul"
            title={good.title}
            body={good.summary}
            onPress={() => router.push('/soul')}
          />
        ) : null}

        {loading ? (
          <View className="h-24 items-center justify-center">
            <ActivityIndicator color="#A489DE" />
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(340).delay(340)} className="items-center mt-8 px-6">
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(164,137,222,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(164,137,222,0.4)',
              }}
            >
              <Feather name="check" size={22} color="#B9A4EC" />
            </View>
            <Text className="text-text-primary mt-4" style={{ ...headingShadow, fontSize: 24 }}>
              You're all caught up
            </Text>
            <Text className="text-text-muted text-sm text-center leading-relaxed mt-2">
              That's today. Nothing more to scroll — go live your day.{'\n'}Fresh things tomorrow.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeArea>
  );
}
