import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { headingShadow } from '@/styles';
import { useLetters, daysAgo, type Letter } from '@/hooks/useLetters';

function DeliveredRow({ letter, onPress }: { letter: Letter; onPress: () => void }) {
  const preview = letter.body.replace(/\s+/g, ' ').trim().slice(0, 90);
  const days = daysAgo(letter.created_at);
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5 active:border-white/20"
    >
      <Text className="text-text-primary text-base leading-relaxed" numberOfLines={2}>
        {preview}
        {letter.body.length > 90 ? '…' : ''}
      </Text>
      <Text className="text-text-muted text-xs mt-2">
        Arrived · written {days === 0 ? 'today' : `${days} days ago`}
      </Text>
    </Pressable>
  );
}

export default function LettersScreen() {
  const router = useRouter();
  const { data: letters = [] } = useLetters();

  const sealed = letters.filter((l) => !l.delivered_at);
  const delivered = letters.filter((l) => l.delivered_at);

  return (
    <SafeArea>
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#9B98A8" />
        </Pressable>
        <Text className="text-text-primary text-3xl font-semibold tracking-tight" style={headingShadow}>
          Letters
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 }}
      >
        <Text className="text-text-secondary text-base leading-relaxed mb-6">
          Write to your future self. One day, when you least expect it, it comes back.
        </Text>

        <Pressable
          onPress={() => router.push('/letters/write')}
          className="bg-surface-2 rounded-2xl px-5 py-5 mb-8 border border-white/10 active:opacity-80 flex-row items-center justify-between"
        >
          <View className="flex-1">
            <Text className="text-text-primary text-lg font-semibold">Write to Future You</Text>
            <Text className="text-text-secondary text-sm mt-1">
              Something they'll need to hear.
            </Text>
          </View>
          <Feather name="edit-3" size={20} color="#A79FB2" />
        </Pressable>

        {sealed.length > 0 && (
          <View className="mb-8">
            <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-3">
              Sealed · {sealed.length}
            </Text>
            {sealed.map((l) => (
              <View
                key={l.id}
                className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5 flex-row items-center gap-3"
              >
                <Feather name="mail" size={18} color="#666270" />
                <View className="flex-1">
                  <Text className="text-text-secondary text-base">A letter to Future You</Text>
                  <Text className="text-text-muted text-xs mt-1">
                    Sealed · it'll return when the time is right.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {delivered.length > 0 && (
          <View>
            <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-3">
              Arrived
            </Text>
            {delivered.map((l) => (
              <DeliveredRow key={l.id} letter={l} onPress={() => router.push(`/letters/${l.id}`)} />
            ))}
          </View>
        )}

        {letters.length === 0 && (
          <Text className="text-text-muted text-sm text-center leading-relaxed mt-6 px-4">
            No letters yet. The first one you write will find you months from now,
            when you've half-forgotten you wrote it.
          </Text>
        )}
      </ScrollView>
    </SafeArea>
  );
}
