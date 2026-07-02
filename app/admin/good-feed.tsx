import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useIsAdmin } from '@/hooks/useAdmin';
import {
  useAllGoodFeedItems,
  useAddGoodFeedItem,
  useRemoveGoodFeedItem,
  thumbnailUrl,
} from '@/hooks/useGoodFeed';

const CATEGORIES = ['kindness', 'animals', 'reunions', 'fails', 'rescues', 'wholesome'];

const inputStyle = {
  backgroundColor: '#161718',
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: '#F0F2F4',
  fontSize: 15,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
} as const;

export default function AdminGoodFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: items, isLoading } = useAllGoodFeedItems();
  const { mutate: addItem, isPending: adding } = useAddGoodFeedItem();
  const { mutate: removeItem } = useRemoveGoodFeedItem();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('wholesome');

  if (adminLoading) return <LoadingSpinner message="Checking access…" />;
  if (!isAdmin) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-10">
        <Text className="text-text-muted text-base text-center">
          This area is for the Alchono team.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6" hitSlop={12}>
          <Text className="text-text-secondary text-base">← Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleAdd = () => {
    if (!url.trim() || !title.trim()) {
      Alert.alert('Missing bits', 'Paste a YouTube link and give it a title.');
      return;
    }
    addItem(
      { url, title, category },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setUrl('');
          setTitle('');
        },
        onError: (e) =>
          Alert.alert('Could not add', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <View
        className="flex-1"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center px-6 mb-4">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <Text className="text-text-secondary text-lg">←</Text>
          </Pressable>
          <Text className="text-text-primary text-lg font-semibold flex-1">
            Good feed · {items?.length ?? 0} videos
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Add form */}
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-white/8" style={{ gap: 10 }}>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Paste a YouTube link…"
              placeholderTextColor="#5E6472"
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title shown in the app"
              placeholderTextColor="#5E6472"
              style={inputStyle}
            />
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`px-3 py-2 rounded-lg border ${
                    category === c ? 'bg-surface-2 border-white/20' : 'border-white/8'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium capitalize ${
                      category === c ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              title={adding ? 'Adding…' : 'Add video'}
              variant="primary"
              size="md"
              fullWidth
              loading={adding}
              onPress={handleAdd}
            />
          </View>

          {/* Catalogue */}
          {isLoading ? (
            <LoadingSpinner message="Loading…" />
          ) : (
            (items ?? []).map((item) => (
              <View
                key={item.id}
                className="flex-row items-center gap-3 bg-surface rounded-xl p-3 mb-2 border border-white/5"
              >
                <Image
                  source={{ uri: thumbnailUrl(item.youtube_id) }}
                  style={{ width: 72, height: 40, borderRadius: 6, backgroundColor: '#161718' }}
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-text-primary text-sm font-medium" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-text-muted text-xs capitalize">{item.category}</Text>
                </View>
                <Pressable
                  onPress={() =>
                    Alert.alert('Remove this video?', item.title, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => removeItem(item.id),
                      },
                    ])
                  }
                  hitSlop={12}
                >
                  <Text className="text-text-muted text-base">×</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
