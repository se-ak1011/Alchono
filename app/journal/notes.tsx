import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import {
  useJournalNotes,
  useDeleteNote,
  getAudioUrl,
  type JournalNote,
} from '@/hooks/useJournalNotes';
import { headingShadow } from '@/styles';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function VoiceNoteRow({ note }: { note: JournalNote }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const togglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playing) {
      await soundRef.current?.stopAsync().catch(() => {});
      setPlaying(false);
      return;
    }
    try {
      setLoading(true);
      if (!soundRef.current) {
        const url = await getAudioUrl(note.audio_path!);
        if (!url) throw new Error('no url');
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) setPlaying(false);
        });
        soundRef.current = sound;
      }
      await soundRef.current.replayAsync();
      setPlaying(true);
    } catch {
      Alert.alert('Could not play', 'Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={togglePlay}
      className="flex-row items-center gap-3 bg-surface-2 rounded-xl px-4 py-3 border border-white/5"
    >
      <View className="w-9 h-9 rounded-full bg-accent items-center justify-center">
        {loading ? (
          <ActivityIndicator size="small" color="#201D28" />
        ) : (
          <Text className="text-bg text-sm font-bold">{playing ? '■' : '▶'}</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-text-primary text-sm font-medium">Voice note</Text>
        <Text className="text-text-muted text-xs mt-0.5">
          {formatDuration(note.duration_seconds ?? 0)}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Your notes — the saved journal (text + voice), lifted out of the Writing
 * Room launcher onto its own screen and reached from the "Your notes" chip.
 */
export default function NotesScreen() {
  const router = useRouter();
  const { data: notes, isLoading } = useJournalNotes();
  const { mutate: deleteNote } = useDeleteNote();

  const confirmDelete = (note: JournalNote) => {
    Alert.alert('Delete this note?', 'Gone for good.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note) },
    ]);
  };

  return (
    <SafeArea bottom={false}>
      <ZoneGlow zone="writing" />
      <View className="px-6 pt-5 pb-3 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <Text className="text-text-primary text-3xl tracking-tight" style={headingShadow}>
          Your notes
        </Text>
      </View>

      <FlatList
        data={notes ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center px-8 mt-24">
              <Text className="text-text-secondary text-base text-center leading-relaxed">
                Nothing written yet.
              </Text>
              <Text className="text-text-muted text-sm text-center leading-relaxed mt-2">
                Anything you write or record in the Writing Room lands here — just for you.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(300).delay(Math.min(index * 30, 300))}
            className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-text-muted text-xs">
                {new Date(item.created_at).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                ·{' '}
                {new Date(item.created_at).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={12}>
                <Text className="text-text-muted text-base leading-none">×</Text>
              </Pressable>
            </View>
            {item.text ? (
              <Text className="text-text-primary text-base leading-relaxed">{item.text}</Text>
            ) : (
              <VoiceNoteRow note={item} />
            )}
          </Animated.View>
        )}
      />
    </SafeArea>
  );
}
