import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, Image, Platform, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CommunityFeed } from '@/components/support/CommunityFeed';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { headingShadow } from '@/styles';
import { useCommunityMoments, type FeedMoment } from '@/hooks/useMoments';
import { useUnreadTotal } from '@/hooks/useMessages';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
const PLUM = '#A489DE';
const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 16;
const GRID_GAP = 12;
const PRINT_W = (SCREEN_W - H_PAD * 2 - GRID_GAP) / 2;

/**
 * Look — the wall of prints. Moments become little printed photos in cream
 * frames, tilted just slightly, scattered two-up like snaps pinned to a
 * board. It's the same shared moments underneath (tap to play), just dressed
 * as a place instead of a scroll of big blocks.
 */
function PrintCard({ item, index }: { item: FeedMoment; index: number }) {
  const router = useRouter();
  const openPlayer = (type: 'photo' | 'video') =>
    router.push({ pathname: '/moments/play', params: { uri: item.url ?? '', momentId: item.id, type, poster: item.thumb_url ?? '', caption: item.caption ?? '', captionPos: item.caption_position ?? '' } });
  const tilt = index % 2 === 0 ? -1.4 : 1.4;
  const isVideo = item.media_type === 'video';
  const src = isVideo ? item.thumb_url : item.url;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ width: PRINT_W, marginBottom: 18, transform: [{ rotate: `${tilt}deg` }] }}>
      <Pressable
        onPress={() => openPlayer(isVideo ? 'video' : 'photo')}
        accessibilityLabel={isVideo ? 'Play video' : 'Open photo'}
        className="active:opacity-90"
        style={{
          backgroundColor: '#e7e1d5',
          borderRadius: 3,
          padding: 6,
          paddingBottom: 9,
          shadowColor: '#000',
          shadowOpacity: 0.45,
          shadowRadius: 9,
          shadowOffset: { width: 0, height: 5 },
          elevation: 5,
        }}
      >
        <View style={{ position: 'relative' }}>
          {src ? (
            <Image source={{ uri: src }} style={{ width: '100%', aspectRatio: 1, backgroundColor: '#201D28', borderRadius: 1 }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#201D28', borderRadius: 1 }} className="items-center justify-center">
              <Text style={{ fontFamily: MONO, fontSize: 11, color: '#817B91' }}>developing…</Text>
            </View>
          )}
          {isVideo && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
                <Feather name="play" size={20} color="#fff" style={{ marginLeft: 2 }} />
              </View>
            </View>
          )}
        </View>
        {/* Caption sits in the print's white margin, like a scribbled note. */}
        {item.caption ? (
          <Text style={{ color: '#3a3340', fontSize: 12.5, lineHeight: 16, marginTop: 7, marginHorizontal: 1 }} numberOfLines={2}>
            {item.caption}
          </Text>
        ) : null}
        <Text style={{ fontFamily: MONO, fontSize: 10.5, color: '#6b6478', marginTop: item.caption ? 4 : 7, marginHorizontal: 1 }} numberOfLines={1}>
          {item.username ? `@${item.username}` : 'anon'}
          {'  ·  '}
          {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function LookFeed() {
  const router = useRouter();
  const { data: moments, isLoading, isRefetching, isError, refetch } = useCommunityMoments();

  if (isLoading) return <LoadingSpinner message="Finding the good stuff…" />;
  if (isError) return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-text-secondary text-base text-center">Moments couldn't load.</Text>
      <Pressable onPress={() => refetch()} className="mt-4 bg-surface-2 rounded-xl px-4 py-2">
        <Text className="text-text-secondary text-sm">Try again</Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-4 mb-2">
        <Text style={{ fontFamily: MONO, fontSize: 11, color: '#817B91', letterSpacing: 1 }}>the wall</Text>
        <Pressable
          onPress={() => router.push('/moments')}
          hitSlop={8}
          className="rounded-full px-3.5 py-1.5 active:opacity-70"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.14)' }}
        >
          <Text style={{ fontFamily: MONO, fontSize: 11.5, color: '#B2ACC0' }}>yours</Text>
        </Pressable>
      </View>
      <FlatList
        data={moments ?? []}
        keyExtractor={(m) => m.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP }}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 40, paddingHorizontal: H_PAD }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        renderItem={({ item, index }) => <PrintCard item={item} index={index} />}
        ListEmptyComponent={
          <View className="items-center px-10 mt-16">
            <Text style={{ fontFamily: MONO, fontSize: 13, color: '#B2ACC0', textAlign: 'center' }}>
              // the wall is empty
            </Text>
            <Text className="text-text-muted text-sm text-center leading-relaxed mt-2">
              Be the first to pin something up — a walk, a meal, a small win from
              your day.
            </Text>
            <Pressable
              onPress={() => router.push('/moments/new')}
              className="mt-6 bg-accent rounded-2xl px-6 py-3 active:bg-accent-dark"
            >
              <Text className="text-bg text-base font-semibold">Pin a moment</Text>
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
  const params = useLocalSearchParams<{ tab?: string; post?: string }>();
  const [tab, setTab] = useState<'look' | 'talk'>(params.tab === 'talk' ? 'talk' : 'look');
  const { data: unread } = useUnreadTotal();

  return (
    <SafeArea bottom={false}>
      <ZoneGlow zone="community" intensity={1.35} />
      <View className="flex-row items-center gap-4 px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="chevron-left" size={26} color="#817B91" />
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-text-primary text-4xl tracking-tight"
            style={headingShadow}
          >
            Community
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 11.5, color: '#817B91', marginTop: 3 }}>
            drop in · say hi · real people, no feed
          </Text>
        </View>
        <View style={{ gap: 6, alignItems: 'flex-end' }}>
          <Pressable
            onPress={() => router.push('/messages')}
            hitSlop={8}
            className="flex-row items-center rounded-full px-3.5 py-1.5 active:opacity-70"
            style={{ backgroundColor: 'rgba(164,137,222,0.12)', borderWidth: 1, borderColor: 'rgba(164,137,222,0.35)' }}
          >
            <Text style={{ fontFamily: MONO, fontSize: 11.5, color: '#C6B2F0' }}>messages</Text>
            {!!unread && (
              <View style={{ marginLeft: 6, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: '#A489DE', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#201D28', fontSize: 9.5, fontWeight: '800' }}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push('/support/mentors')}
            hitSlop={8}
            className="rounded-full px-3.5 py-1.5 active:opacity-70"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.14)' }}
          >
            <Text style={{ fontFamily: MONO, fontSize: 11.5, color: '#B2ACC0' }}>mentors</Text>
          </Pressable>
        </View>
      </View>

      {/* Look | Talk — retro tabs. */}
      <View className="mx-6 mt-1 mb-3 flex-row" style={{ gap: 8 }}>
        {(['look', 'talk'] as const).map((t) => {
          const on = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab(t);
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 11,
                backgroundColor: on ? 'rgba(164,137,222,0.16)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: on ? 'rgba(164,137,222,0.5)' : 'rgba(236,233,241,0.08)',
              }}
            >
              <Text style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1, color: on ? '#ECE9F1' : '#817B91' }}>
                {t === 'look' ? '▚ LOOK' : '✎ TALK'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'look' ? (
        <LookFeed />
      ) : (
        <View className="flex-1">
          <CommunityFeed
            onTalkToAi={() => router.push('/support/coach')}
            onFindMentor={() => router.push('/support/mentors')}
            initialPostId={params.post}
          />
        </View>
      )}
    </SafeArea>
  );
}
