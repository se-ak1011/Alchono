import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { useIsAdmin } from '@/hooks/useAdmin';
import {
  useAdminPending,
  usePublishContent,
  useRemoveContent,
  useGenerateContent,
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
  const { mutate: generate, isPending: generating } = useGenerateContent();

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
            AI publishes what's clearly good. It only holds the maybes here.
          </Text>
        </View>
        {isAdmin && (
          <Pressable
            disabled={generating}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              generate(undefined, {
                onSuccess: (r) =>
                  Alert.alert(
                    'Fresh batch',
                    `Giggles: ${r.giggles.published} live · ${r.giggles.held} held\nThought: ${r.dilemmas.published} live · ${r.dilemmas.held} held`,
                  ),
                onError: (error) =>
                  Alert.alert(
                    'Could not generate',
                    error instanceof Error ? error.message : 'Please try again in a moment.',
                  ),
              });
            }}
            className="bg-surface-2 rounded-full px-3.5 py-2 border border-white/10 active:opacity-70 flex-row items-center gap-2"
          >
            {generating ? (
              <ActivityIndicator size="small" color="#B2ACC0" />
            ) : (
              <Feather name="refresh-cw" size={14} color="#B2ACC0" />
            )}
            <Text className="text-text-secondary text-xs font-semibold">
              {generating ? 'Writing…' : 'Generate'}
            </Text>
          </Pressable>
        )}
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
            <Text className="text-text-secondary text-base text-center leading-relaxed mt-24 px-6">
              Nothing held — the AI cleared everything it generated. Tap Generate
              for more any time.
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
