import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useIsAdmin,
  useAdminReports,
  useUpdateReportStatus,
  type AdminReport,
  useModeratedTalkPosts,
  useModerateTalkPost,
} from '@/hooks/useAdmin';

type Filter = 'open' | 'all';

function ReportCard({ report }: { report: AdminReport }) {
  const { mutate: updateStatus, isPending } = useUpdateReportStatus();
  const isOpen = report.status === 'open';

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className={`bg-surface rounded-2xl px-5 py-5 mb-3 border ${
        isOpen ? 'border-danger/30' : 'border-white/5 opacity-60'
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase">
          {report.status}
        </Text>
        <Text className="text-text-muted text-xs">
          {new Date(report.created_at).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <Text className="text-text-primary text-base font-semibold mb-1">
        {report.reportedUsername}
      </Text>
      <Text className="text-text-muted text-sm mb-3">
        reported by {report.reporterUsername}
      </Text>

      <Text className="text-text-secondary text-base leading-relaxed mb-1">
        {report.reason}
      </Text>
      {report.details && (
        <Text className="text-text-muted text-sm leading-relaxed mb-1">
          {report.details}
        </Text>
      )}
      {report.request_id && (
        <Text className="text-text-muted text-xs mb-1">
          mentor thread: {report.request_id}
        </Text>
      )}

      {isOpen && (
        <View className="flex-row gap-2 mt-4">
          <Pressable
            disabled={isPending}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              updateStatus({ reportId: report.id, status: 'dismissed' });
            }}
            className="flex-1 items-center py-3 rounded-xl bg-surface-2 border border-white/10 active:border-white/25"
          >
            <Text className="text-text-secondary text-sm font-semibold">Dismiss</Text>
          </Pressable>
          <Pressable
            disabled={isPending}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              updateStatus({ reportId: report.id, status: 'resolved' });
            }}
            className="flex-1 items-center py-3 rounded-xl bg-accent active:bg-accent-dark"
          >
            <Text className="text-bg text-sm font-semibold">Resolve</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

export default function AdminReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: reports, isLoading } = useAdminReports();
  const [filter, setFilter] = useState<Filter>('open');
  const { data: talkPosts = [] } = useModeratedTalkPosts();
  const { mutate: moderateTalk, isPending: moderatingTalk } = useModerateTalkPost();

  if (adminLoading) return <LoadingSpinner message="Checking access…" />;

  if (!isAdmin) {
    return (
      <View
        className="flex-1 bg-bg items-center justify-center px-10"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-text-muted text-base text-center">
          This area is for the Alchono team.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6" hitSlop={12}>
          <Text className="text-text-secondary text-base">← Back</Text>
        </Pressable>
      </View>
    );
  }

  const visible = (reports ?? []).filter((r) =>
    filter === 'open' ? r.status === 'open' : true,
  );
  const openCount = (reports ?? []).filter((r) => r.status === 'open').length;

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center px-6 mb-4">
        <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
          <Text className="text-text-secondary text-lg">←</Text>
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold flex-1">
          Moderation {openCount > 0 ? `· ${openCount} open` : ''}
        </Text>
      </View>

      {/* Filter */}
      <View className="flex-row mx-6 mb-4 bg-surface rounded-xl p-1">
        {(['open', 'all'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg items-center ${
              filter === f ? 'bg-surface-2' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold capitalize ${
                filter === f ? 'text-text-primary' : 'text-text-muted'
              }`}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading reports…" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {talkPosts.length > 0 && (
            <View className="mb-6">
              <Text className="text-text-primary text-lg font-semibold mb-3">Reported Talk posts</Text>
              {talkPosts.map((post) => {
                const openReports = post.reports.filter((report) => report.status === 'open');
                return (
                  <View key={post.id} className="bg-surface rounded-2xl px-5 py-5 mb-3 border border-danger/30">
                    <Text className="text-text-muted text-xs uppercase tracking-widest">{post.moderation_status} · {post.reports.length} {post.reports.length === 1 ? 'report' : 'reports'}</Text>
                    <Text className="text-text-primary text-sm font-semibold mt-2">{post.author} · {new Date(post.created_at).toLocaleDateString('en-GB')}</Text>
                    <Text className="text-text-secondary text-base leading-relaxed mt-2">{post.content}</Text>
                    <Text className="text-text-muted text-sm mt-3">Reasons: {post.reports.map((report) => report.reason).join(', ')}</Text>
                    {openReports.length > 0 && post.moderation_status !== 'removed' && (
                      <View className="flex-row gap-2 mt-4">
                        <Pressable disabled={moderatingTalk} onPress={() => moderateTalk({ postId: post.id, action: 'ignore' })} className="flex-1 items-center py-3 rounded-xl bg-surface-2"><Text className="text-text-secondary text-sm font-semibold">Ignore report</Text></Pressable>
                        <Pressable disabled={moderatingTalk} onPress={() => moderateTalk({ postId: post.id, action: 'remove' })} className="flex-1 items-center py-3 rounded-xl bg-danger"><Text className="text-white text-sm font-semibold">Remove post</Text></Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          {visible.length === 0 ? (
            <View className="py-16 items-center">
              <Text className="text-text-muted text-base text-center">
                {filter === 'open' ? 'No open reports. All quiet.' : 'No reports yet.'}
              </Text>
            </View>
          ) : (
            visible.map((r) => <ReportCard key={r.id} report={r} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
