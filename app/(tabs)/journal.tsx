import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { CompanionActionZone } from "@/components/ui/CompanionActionZone";
import { SafeArea } from "@/components/ui/SafeArea";
import { useCompanion } from "@/hooks/useCompanion";
import {
  useJournalNotes,
  useAddTextNote,
  useAddVoiceNote,
  useDeleteNote,
  getAudioUrl,
  type JournalNote,
} from "@/hooks/useJournalNotes";
import { headingShadow } from "@/styles";

const JOURNAL_COMPANION_IMAGE_WIDTH = 108;
const JOURNAL_COMPANION_IMAGE_HEIGHT = 128;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
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
        if (!url) throw new Error("no url");
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) setPlaying(false);
        });
        soundRef.current = sound;
      }
      await soundRef.current.replayAsync();
      setPlaying(true);
    } catch {
      Alert.alert("Could not play", "Try again in a moment.");
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
          <Text className="text-bg text-sm font-bold">
            {playing ? "■" : "▶"}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-text-primary text-sm font-medium">
          Voice note
        </Text>
        <Text className="text-text-muted text-xs mt-0.5">
          {formatDuration(note.duration_seconds ?? 0)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function JournalScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const { data: notes, isLoading } = useJournalNotes();
  const { mutate: addText, isPending: savingText } = useAddTextNote();
  const { mutate: addVoice, isPending: savingVoice } = useAddVoiceNote();
  const { mutate: deleteNote } = useDeleteNote();

  const [draft, setDraft] = useState("");
  const [companionMenuOpen, setCompanionMenuOpen] = useState(false);
  const [quietCompanionSignal, setQuietCompanionSignal] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (recording) return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Microphone needed",
          "Voice notes need mic access. You can also dictate into the text box with your keyboard mic.",
        );
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Full audio-session config: without an explicit interruption mode,
      // iOS can refuse to activate a recording session while another app
      // (music, a podcast) holds audio. DoNotMix takes the session over.
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setRecordSeconds(0);
      timerRef.current = setInterval(
        () => setRecordSeconds((s) => s + 1),
        1000,
      );
    } catch (e) {
      console.error("[journal] startRecording failed:", e);
      Alert.alert(
        "Could not start recording",
        e instanceof Error ? e.message : "Please try again.",
      );
      // Leave the session clean so the next attempt starts fresh.
      Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
    }
  };

  const stopRecording = async (save: boolean) => {
    if (!recording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const seconds = recordSeconds;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);
      setRecordSeconds(0);
      if (save && uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addVoice(
          { localUri: uri, durationSeconds: seconds },
          {
            onError: (e) =>
              Alert.alert(
                "Could not save",
                e instanceof Error ? e.message : "Try again.",
              ),
          },
        );
      }
    } catch {
      setRecording(null);
      setRecordSeconds(0);
    }
  };

  const handleSaveText = () => {
    if (!draft.trim() || savingText) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addText(draft, {
      onSuccess: () => setDraft(""),
      onError: (e) =>
        Alert.alert(
          "Could not save",
          e instanceof Error ? e.message : "Try again.",
        ),
    });
  };

  const confirmDelete = (note: JournalNote) => {
    Alert.alert("Delete this note?", "Gone for good.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNote(note) },
    ]);
  };

  return (
    <SafeArea bottom={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <View className="px-6 pt-5 pb-3">
          <Text
            className="text-text-primary text-3xl font-semibold tracking-tight"
            style={headingShadow}
          >
            Journal
          </Text>
          <Text className="text-text-secondary text-base mt-1">
            Written or spoken. Yours alone.
          </Text>
        </View>

        {/* Compose */}
        <View className="mx-6 mb-4 bg-surface rounded-2xl p-4 border border-white/8">
          {recording ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="items-center py-4"
            >
              <View className="w-3 h-3 rounded-full bg-danger-light mb-3" />
              <Text className="text-text-primary text-2xl font-semibold mb-1">
                {formatDuration(recordSeconds)}
              </Text>
              <Text className="text-text-muted text-sm mb-5">Recording…</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => stopRecording(false)}
                  className="px-6 py-3 rounded-xl bg-surface-2 border border-white/10"
                >
                  <Text className="text-text-secondary text-sm font-semibold">
                    Discard
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => stopRecording(true)}
                  className="px-6 py-3 rounded-xl bg-accent"
                >
                  <Text className="text-bg text-sm font-semibold">
                    Save note
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="What's on your mind? Tap the mic on your keyboard to just talk…"
                placeholderTextColor="#817B91"
                multiline
                maxLength={2000}
                className="text-text-primary text-base leading-relaxed min-h-[72px]"
                selectionColor="#B2ACC0"
              />
              <View className="flex-row items-center justify-between mt-3">
                <Pressable
                  onPress={startRecording}
                  disabled={savingVoice}
                  className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-white/10 active:border-white/25"
                >
                  {savingVoice ? (
                    <ActivityIndicator size="small" color="#B2ACC0" />
                  ) : (
                    <Text className="text-text-secondary text-sm font-semibold">
                      ● Record voice note
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={handleSaveText}
                  disabled={!draft.trim() || savingText}
                  className={`px-5 py-2.5 rounded-xl ${
                    draft.trim() && !savingText ? "bg-accent" : "bg-surface-2"
                  }`}
                >
                  {savingText ? (
                    <ActivityIndicator size="small" color="#ECE9F1" />
                  ) : (
                    <Text
                      className={`text-sm font-semibold ${
                        draft.trim() ? "text-bg" : "text-text-muted"
                      }`}
                    >
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>

        <CompanionActionZone
          context="journal"
          visible={companionMenuOpen}
          onClose={() => setCompanionMenuOpen(false)}
          source={pose("journal")}
          width={JOURNAL_COMPANION_IMAGE_WIDTH}
          height={JOURNAL_COMPANION_IMAGE_HEIGHT}
          zoneHeight={companionMenuOpen ? 228 : 140}
          companionLeft={112}
          companionTop={companionMenuOpen ? 78 : 6}
          points={[
            { x: 0, y: -74 },
            { x: -98, y: 42 },
            { x: 96, y: 42 },
          ]}
          caption={{ x: 0, y: -94 }}
          className="mx-6 mb-2"
          onPress={() => setCompanionMenuOpen(true)}
          onLongPress={() => {
            if (!companionMenuOpen)
              setQuietCompanionSignal((signal) => signal + 1);
          }}
          quietSignal={quietCompanionSignal}
          onVoiceNote={startRecording}
        />

        <View className="mx-6 mb-4">
          <Text className="text-text-primary text-xl font-semibold">
            Letters
          </Text>
          <Text className="text-text-secondary text-sm mt-1 leading-relaxed">
            Write to your future self. One day, when you least expect it, it
            comes back.
          </Text>
          <Pressable
            onPress={() => router.push("/letters/write")}
            className="mt-3 bg-surface rounded-2xl px-5 py-4 border border-white/8 active:border-white/20"
          >
            <Text className="text-text-primary text-base font-semibold">
              Write to Future You
            </Text>
            <Text className="text-text-muted text-sm mt-1">
              Something they'll need to hear.
            </Text>
          </Pressable>
        </View>

        {/* Notes */}
        <FlatList
          data={notes ?? []}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(300).delay(
                Math.min(index * 30, 300),
              )}
              className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-text-muted text-xs">
                  {new Date(item.created_at).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  ·{" "}
                  {new Date(item.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Pressable onPress={() => confirmDelete(item)} hitSlop={12}>
                  <Text className="text-text-muted text-base leading-none">
                    ×
                  </Text>
                </Pressable>
              </View>
              {item.text ? (
                <Text className="text-text-primary text-base leading-relaxed">
                  {item.text}
                </Text>
              ) : (
                <VoiceNoteRow note={item} />
              )}
            </Animated.View>
          )}
        />
      </KeyboardAvoidingView>

    </SafeArea>
  );
}
