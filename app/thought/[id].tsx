import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import {
  useDilemma,
  useMyVote,
  useDilemmaResults,
  useVoteDilemma,
  CHOICES,
  type Choice,
} from '@/hooks/useThought';
import { FOOD } from '@/lib/food';
import { headingShadow } from '@/styles';

const S = FOOD.thought;

function Wash() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}>
      <LinearGradient
        colors={[S.wash, 'rgba(138,178,174,0.06)', 'rgba(32,29,40,0)']}
        locations={[0, 0.45, 1]}
        style={{ flex: 1 }}
      />
    </View>
  );
}

export default function DilemmaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dilemma, isLoading } = useDilemma(id);
  const { data: myVote } = useMyVote(id);
  const hasVoted = !!myVote;
  const { data: results } = useDilemmaResults(id, hasVoted);
  const { mutate: vote, isPending } = useVoteDilemma();

  const cast = (choice: Choice) => {
    if (hasVoted || isPending || !id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    vote({ dilemmaId: id, choice });
  };

  return (
    <SafeArea>
      <Wash />
      <View className="px-6 pt-4 pb-1 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <Text style={{ color: S.accent, fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 }}>
          FOOD FOR THOUGHT
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#A489DE" />
        </View>
      ) : !dilemma ? (
        <Text className="text-text-muted text-base text-center mt-24 px-10">
          This one's no longer here.
        </Text>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-text-primary text-2xl font-semibold leading-snug mb-3" style={headingShadow}>
            {dilemma.title}
          </Text>
          <Text className="text-text-secondary text-base leading-relaxed">{dilemma.story}</Text>

          <Text className="text-text-primary text-lg font-semibold mt-8 mb-3">
            What do you think?
          </Text>

          {!hasVoted ? (
            <View style={{ gap: 10 }}>
              {CHOICES.map((c) => (
                <Pressable
                  key={c.key}
                  disabled={isPending}
                  onPress={() => cast(c.key)}
                  className="bg-surface rounded-2xl px-5 py-4 border border-white/10 active:border-white/30"
                >
                  <Text className="text-text-primary text-base font-medium">{c.label}</Text>
                </Pressable>
              ))}
              <Text className="text-text-muted text-xs leading-relaxed mt-1">
                Anonymous. You get one vote — then you'll see how everyone else saw it.
              </Text>
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)} style={{ gap: 10 }}>
              {CHOICES.map((c) => {
                const pct = results?.pct[c.key] ?? 0;
                const mine = myVote === c.key;
                return (
                  <View
                    key={c.key}
                    style={{
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: mine ? S.edge : 'rgba(236,233,241,0.08)',
                      backgroundColor: '#2A2634',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Proportional fill */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${pct}%`,
                        backgroundColor: mine ? S.tint : 'rgba(236,233,241,0.05)',
                      }}
                    />
                    <View className="flex-row items-center justify-between px-4 py-3.5">
                      <Text
                        className="flex-1 pr-3"
                        style={{ color: mine ? '#ECE9F1' : '#B2ACC0', fontSize: 15, fontFamily: mine ? 'Inter_600SemiBold' : 'Inter_400Regular' }}
                      >
                        {c.label}
                        {mine ? '  ·  you' : ''}
                      </Text>
                      <Text style={{ color: mine ? S.accent : '#817B91', fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
                        {pct}%
                      </Text>
                    </View>
                  </View>
                );
              })}
              <Text className="text-text-muted text-xs mt-1">
                {results ? `${results.total} ${results.total === 1 ? 'person has' : 'people have'} weighed in.` : ' '}
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      )}
    </SafeArea>
  );
}
