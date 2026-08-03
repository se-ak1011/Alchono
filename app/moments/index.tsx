import React, { useState } from 'react';
import { View, Text, Pressable, Image, FlatList, ScrollView, Alert, Dimensions } from 'react-native';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { RoomBackdrop } from '@/components/ui/RoomBackdrop';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { headingShadow } from '@/styles';
import { useMyMoments, useDeleteMoment, useSetMomentCollection, type MyMoment } from '@/hooks/useMoments';

// Photo prints laid out on a table, not a cold gallery grid: two to a row,
// each in a cream border with a soft shadow and a gentle tilt.
const H_PAD = 18;
const COL_GAP = 16;
const COLS = 2;
const SIZE = (Dimensions.get('window').width - H_PAD * 2 - COL_GAP) / COLS;
const PRINT = '#EDE7DA';

function statusLabel(m: MyMoment): string | null {
  if (!m.shared) return null;
  if (m.moderation_status === 'pending') return 'Checking…';
  if (m.moderation_status === 'rejected') return "Couldn't share";
  if (m.moderation_status === 'approved') return 'Shared';
  return null;
}

export default function MyMomentsScreen() {
  const router = useRouter();
  const { data: moments = [], isLoading } = useMyMoments();
  const { mutate: remove } = useDeleteMoment();
  const { mutate: setCollection } = useSetMomentCollection();
  const [activeBook, setActiveBook] = useState<string | null>(null);

  // Distinct scrapbook names the person has created, for the filter chips.
  const books = Array.from(new Set(moments.map((m) => m.collection).filter(Boolean))) as string[];
  const visible = activeBook ? moments.filter((m) => m.collection === activeBook) : moments;

  const confirmDelete = (m: MyMoment) => {
    Alert.alert('Delete this moment?', 'This removes it everywhere, for good.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove({ id: m.id, media_path: m.media_path, thumb_path: m.thumb_path }),
      },
    ]);
  };

  const promptBook = (m: MyMoment) => {
    if (!Alert.prompt) {
      Alert.alert('Not available', 'Naming a scrapbook needs iOS for now.');
      return;
    }
    Alert.prompt(
      'Add to a scrapbook',
      'Name a scrapbook — a new one, or one you already have.',
      (name?: string) => {
        const clean = name?.trim();
        if (clean) setCollection({ id: m.id, collection: clean });
      },
      'plain-text',
      m.collection ?? '',
    );
  };

  const momentActions = (m: MyMoment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('This moment', undefined, [
      { text: m.collection ? 'Move to another scrapbook…' : 'Add to a scrapbook…', onPress: () => promptBook(m) },
      ...(m.collection ? [{ text: 'Remove from scrapbook', onPress: () => setCollection({ id: m.id, collection: null }) }] : []),
      { text: 'Delete', style: 'destructive' as const, onPress: () => confirmDelete(m) },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <SafeArea>
      <ZoneGlow zone="community" intensity={0.55} />
      {/* A warm tabletop the prints are scattered on. */}
      <RoomBackdrop warmth="#D6A184" floor="#2A2530" lampTop={150} horizon={0.64} intensity={0.6} />
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
            <Feather name="chevron-left" size={26} color="#B2ACC0" />
          </Pressable>
          <Text className="text-text-primary text-3xl font-semibold tracking-tight" style={headingShadow}>
            Your moments
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/moments/new')}
          hitSlop={8}
          className="w-10 h-10 rounded-full bg-accent items-center justify-center active:bg-accent-dark"
        >
          <Feather name="plus" size={22} color="#201D28" />
        </Pressable>
      </View>

      {moments.length > 0 && (
        <Text className="text-text-muted text-xs px-6 mb-2">
          Long-press a moment to file it in a scrapbook.
        </Text>
      )}

      {books.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 12 }}
        >
          {([null, ...books] as (string | null)[]).map((b) => {
            const active = activeBook === b;
            return (
              <Pressable
                key={b ?? '__all'}
                onPress={() => setActiveBook(b)}
                className={`px-3.5 py-1.5 rounded-full border ${active ? 'bg-surface-2 border-accent' : 'bg-surface border-white/10'}`}
              >
                <Text className={`text-sm font-medium ${active ? 'text-text-primary' : 'text-text-muted'}`}>
                  {b ?? 'All'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={visible}
        keyExtractor={(m) => m.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: COL_GAP }}
        contentContainerStyle={{ gap: 18, paddingHorizontal: H_PAD, paddingTop: 4, paddingBottom: 44 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const label = statusLabel(item);
          const inner = SIZE - 12;
          const tilt = index % 2 === 0 ? '-1.4deg' : '1.5deg';
          return (
            <Pressable
              onPress={() => {
                const uri = item.mediaUrl ?? item.url;
                if (uri)
                  router.push({
                    pathname: '/moments/play',
                    params: { uri, type: item.media_type },
                  });
              }}
              onLongPress={() => momentActions(item)}
              style={{ width: SIZE, transform: [{ rotate: tilt }] }}
            >
              {/* The print: a cream border with a bottom lip and a soft shadow. */}
              <View
                style={{
                  backgroundColor: PRINT,
                  borderRadius: 5,
                  padding: 6,
                  paddingBottom: 12,
                  shadowColor: '#000',
                  shadowOpacity: 0.38,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 5 },
                }}
              >
                <View style={{ width: inner, height: inner, borderRadius: 2, overflow: 'hidden', backgroundColor: '#2A2530' }}>
                  {item.url ? (
                    <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Feather name="image" size={20} color="#6f6980" />
                    </View>
                  )}
                  {item.media_type === 'video' && (
                    <View className="absolute inset-0 items-center justify-center">
                      <View className="w-9 h-9 rounded-full bg-black/50 items-center justify-center">
                        <Feather name="play" size={16} color="#fff" />
                      </View>
                    </View>
                  )}
                  {label && (
                    <View className="absolute bottom-0 left-0 right-0 bg-black/55 px-1.5 py-1">
                      <Text className="text-white text-[10px] font-medium" numberOfLines={1}>
                        {label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center px-10 mt-20">
              <Text className="text-text-secondary text-base text-center leading-relaxed">
                No moments yet.
              </Text>
              <Text className="text-text-muted text-sm text-center leading-relaxed mt-2">
                Save a photo or video that meant something — a walk, a meal, a
                small win. Keep it for yourself, or share it.
              </Text>
              <Pressable
                onPress={() => router.push('/moments/new')}
                className="mt-6 bg-accent rounded-2xl px-6 py-3 active:bg-accent-dark"
              >
                <Text className="text-bg text-base font-semibold">Add your first</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeArea>
  );
}
