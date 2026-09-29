import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { PaperCanvas, Placeable } from '@/components/paper/PaperCanvas';
import {
  useJournalNotes,
  useDeleteNote,
  getAudioUrl,
  type JournalNote,
} from '@/hooks/useJournalNotes';

const INK = '#332a24';
const INK_SOFT = 'rgba(51,42,36,0.55)';

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
    <Pressable onPress={togglePlay} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#A489DE', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <ActivityIndicator size="small" color="#201D28" />
        ) : (
          <Text style={{ color: '#201D28', fontSize: 13, fontWeight: '700' }}>{playing ? '■' : '▶'}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'PatrickHand', fontSize: 16, color: INK }}>Voice note</Text>
        <Text style={{ color: INK_SOFT, fontSize: 11 }}>{formatDuration(note.duration_seconds ?? 0)}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Your notes — the saved journal (text + voice), written on the notebook page.
 */
export default function NotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: notes, isLoading } = useJournalNotes();
  const { mutate: deleteNote } = useDeleteNote();

  const confirmDelete = (note: JournalNote) => {
    Alert.alert('Delete this note?', 'Gone for good.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note) },
    ]);
  };

  return (
    <PaperBackground>
      <PaperCanvas label="Your notes">
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
            <Feather name="chevron-left" size={26} color={INK} />
          </Pressable>
          <Placeable id="title" def={{ dx: 0.173, dy: 0.052 }}>
            <Text style={{ fontFamily: 'PatrickHand', fontSize: 30, color: INK }}>Your notes</Text>
          </Placeable>
        </View>

        <FlatList
          data={notes ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingHorizontal: 30, paddingTop: 4, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ alignItems: 'center', paddingHorizontal: 20, marginTop: 90 }}>
                <Text style={{ color: INK, fontSize: 16, textAlign: 'center', lineHeight: 22, fontFamily: 'PatrickHand' }}>Nothing written yet.</Text>
                <Text style={{ color: INK_SOFT, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 }}>
                  Anything you write or record in the Writing Room lands here — just for you.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(300).delay(Math.min(index * 30, 300))}
              style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(51,42,36,0.14)' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: INK_SOFT, fontSize: 11.5 }}>
                  {new Date(item.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}
                  {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Pressable onPress={() => confirmDelete(item)} hitSlop={12}>
                  <Text style={{ color: INK_SOFT, fontSize: 18, lineHeight: 18 }}>×</Text>
                </Pressable>
              </View>
              {item.text ? (
                <Text style={{ color: INK, fontFamily: 'PatrickHand', fontSize: 17, lineHeight: 23 }}>{item.text}</Text>
              ) : (
                <VoiceNoteRow note={item} />
              )}
            </Animated.View>
          )}
        />
      </View>
      </PaperCanvas>
    </PaperBackground>
  );
}
