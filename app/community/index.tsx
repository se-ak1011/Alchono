import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CommunityFeed } from '@/components/support/CommunityFeed';
import { headingShadow } from '@/styles';
import { useCommunityMoments, type FeedMoment } from '@/hooks/useMoments';

function MomentCard({ item }: { item: FeedMoment }) {
  const router = useRouter();
  const openPlayer = (uri: string, type: 'photo' | 'video') =>
    router.push({ pathname: '/moments/play', params: { uri, type } });
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="mx-6 mb-5 bg-surface rounded-3xl overflow-hidden border border-white/8"
    >
      {item.media_type === 'video' && item.url ? (
        <Pressable onPress={() => openPlayer(item.url!, 'video')}>
          <Image
            source={{ uri: item.thumb_url ?? item.url }}
            style={{ width: '100%', aspectRatio: 1, backgroundColor: '#201D28' }}
            resizeMode="cover"
          />
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-black/45 items-center justify-center">
              <Feather name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
            </View>
          </View>
        </Pressable>
      ) : item.url ? (
        <Pressable onPress={() => openPlayer(item.url!, 'photo')}>
          <Image
            source={{ uri: item.url }}
            style={{ width: '100%', aspectRatio: 1, backgroundColor: '#201D28' }}
            resizeMode="cover"
          />
        </Pressable>
      ) : null}
      <View className="px-5 py-4">
        {item.caption ? (
          <Text className="text-text-primary text-base leading-relaxed mb-2">
            {item.caption}
          </Text>
        ) : null}
        <Text className="text-text-muted text-sm">
          {item.username ? `@${item.username}` : 'Anonymous'}
          {'  ·  '}
          {new Date(item.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

function LookFeed() {
  const router = useRouter();
  const { data: moments, isLoading } = useCommunityMoments();

  if (isLoading) return <LoadingSpinner message="Finding the good stuff…" />;

  return (
    <View className="flex-1">
      <View className="flex-row justify-end px-6 mb-1">
        <Pressable
          onPress={() => router.push('/moments')}
          hitSlop={8}
          className="bg-surface-2 rounded-full px-3.5 py-1.5 border border-white/10 active:opacity-70"
        >
          <Text className="text-text-secondary text-xs font-semibold">Yours</Text>
        </Pressable>
      </View>
      <FlatList
        data={moments ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <MomentCard item={item} />}
        ListEmptyComponent={
          <View className="items-center px-10 mt-16">
            <Text className="text-text-secondary text-base text-center leading-relaxed">
              Nothing here yet.
            </Text>
            <Text className="text-text-muted text-sm text-center leading-relaxed mt-2">
              Be the first to share something good — a walk, a meal, a small win
              from your day.
            </Text>
            <Pressable
              onPress={() => router.push('/moments/new')}
              className="mt-6 bg-accent rounded-2xl px-6 py-3 active:bg-accent-dark"
            >
              <Text className="text-bg text-base font-semibold">Share a moment</Text>
            </Pressable>
          </View>
        }
      />
      {(moments?.length ?? 0) > 0 && (
        <Pressable
          onPress={() => router.push('/moments/new')}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center active:bg-accent-dark"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Feather name="plus" size={26} color="#201D28" />
        </Pressable>
      )}
    </View>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'look' | 'talk'>('look');

  return (
    <SafeArea bottom={false}>
      <View className="flex-row items-center gap-4 px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="chevron-left" size={26} color="#817B91" />
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-text-primary text-3xl font-semibold tracking-tight"
            style={headingShadow}
          >
            Community
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            See what others share, or talk it through.
          </Text>
        </View>
      </View>

      {/* Look | Talk */}
      <View className="mx-6 mt-1 mb-3 flex-row bg-surface rounded-full p-1 border border-white/8">
        {(['look', 'talk'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTab(t);
            }}
            className={`flex-1 rounded-full py-2.5 items-center ${
              tab === t ? 'bg-surface-2' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                tab === t ? 'text-text-primary' : 'text-text-muted'
              }`}
            >
              {t === 'look' ? 'Look' : 'Talk'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'look' ? (
        <LookFeed />
      ) : (
        <View className="flex-1">
          <CommunityFeed
            onTalkToAi={() => router.push('/support/coach')}
            onFindMentor={() => router.push('/support/mentors')}
          />
        </View>
      )}
    </SafeArea>
  );
}
