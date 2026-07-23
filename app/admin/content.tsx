import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { useIsAdmin } from '@/hooks/useAdmin';
import {
  useAdminPending,
  usePublishContent,
  useRemoveContent,
  type ContentTable,
} from '@/hooks/useAdminContent';
import { headingShadow } from '@/styles';

function ReviewCard({
  table,
  id,
  title,
  body,
  meta,
}: {
  table: ContentTable;
  id: string;
  title: string;
  body: string;
  meta?: string | null;
}) {
  const { mutate: publish, isPending: publishing } = usePublishContent();
  const { mutate: remove, isPending: removing } = useRemoveContent();
  const busy = publishing || removing;

  return (
    <View className="bg-surface rounded-3xl px-5 py-5 mb-3 border border-white/8">
      {meta ? (
        <Text className="text-text-muted text-xs uppercase tracking-widest mb-1.5">{meta}</Text>
      ) : null}
      <Text className="text-text-primary text-lg font-semibold leading-snug">{title}</Text>
      <Text className="text-text-secondary text-base leading-relaxed mt-2.5">{body}</Text>
      <View className="flex-row gap-2 mt-4">
        <Pressable
          disabled={busy}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            publish({ table, id });
          }}
          className="flex-1 rounded-2xl py-3 items-center bg-accent active:opacity-80"
        >
          <Text className="text-bg text-base font-semibold">Approve</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            remove({ table, id });
          }}
          className="flex-1 rounded-2xl py-3 items-center bg-surface-2 border border-white/10 active:opacity-70"
        >
          <Text className="text-danger text-base font-semibold">Bin</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminContentScreen() {
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data, isLoading } = useAdminPending();

  const stories = data?.stories ?? [];
  const dilemmas = data?.dilemmas ?? [];
  const total = stories.length + dilemmas.length;

  return (
    <SafeArea>
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 30 }}>
            Review content
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            Nothing publishes until you approve it.
          </Text>
        </View>
      </View>

      {!adminLoading && !isAdmin ? (
        <Text className="text-text-muted text-base text-center mt-24 px-10">
          This area is for admins only.
        </Text>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#A489DE" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {total === 0 ? (
            <Text className="text-text-secondary text-base text-center leading-relaxed mt-24">
              Nothing waiting. Generate a fresh batch and it'll appear here.
            </Text>
          ) : null}

          {stories.length > 0 && (
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-2.5 mt-2">
              Giggles · {stories.length}
            </Text>
          )}
          {stories.map((s) => (
            <ReviewCard key={s.id} table="curated_stories" id={s.id} title={s.title} body={s.body} meta={s.category} />
          ))}

          {dilemmas.length > 0 && (
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-2.5 mt-4">
              Dilemmas · {dilemmas.length}
            </Text>
          )}
          {dilemmas.map((d) => (
            <ReviewCard key={d.id} table="dilemmas" id={d.id} title={d.title} body={d.story} meta="Food for Thought" />
          ))}
        </ScrollView>
      )}
    </SafeArea>
  );
}
