import React from 'react';
import { View, Text, Pressable, Image, FlatList, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { headingShadow } from '@/styles';
import { useMyMoments, useDeleteMoment, type MyMoment } from '@/hooks/useMoments';

const GAP = 4;
const COLS = 3;
const SIZE = (Dimensions.get('window').width - GAP * (COLS - 1)) / COLS;

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

  const confirmDelete = (m: MyMoment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete this moment?', 'This removes it everywhere, for good.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove({ id: m.id, media_path: m.media_path, thumb_path: m.thumb_path }),
      },
    ]);
  };

  return (
    <SafeArea>
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

      <FlatList
        data={moments}
        keyExtractor={(m) => m.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const label = statusLabel(item);
          return (
            <Pressable
              onLongPress={() => confirmDelete(item)}
              style={{ width: SIZE, height: SIZE }}
              className="bg-surface overflow-hidden"
            >
              {item.url ? (
                <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Feather name="image" size={20} color="#3A3A42" />
                </View>
              )}
              {item.media_type === 'video' && (
                <View className="absolute top-1.5 right-1.5">
                  <Feather name="video" size={14} color="#ECE9F1" />
                </View>
              )}
              {label && (
                <View className="absolute bottom-0 left-0 right-0 bg-black/55 px-1.5 py-1">
                  <Text className="text-white text-[10px] font-medium" numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              )}
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
