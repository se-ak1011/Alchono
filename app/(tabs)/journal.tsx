import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { ZoneGlow } from "@/components/ui/ZoneGlow";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { OrbitChip } from "@/components/ui/OrbitChip";
import { useCompanion } from "@/hooks/useCompanion";
import { useAddVoiceNote, useJournalNotes } from "@/hooks/useJournalNotes";
import { ZONES } from "@/lib/zones";
import { headingShadow } from "@/styles";

const WRITING = ZONES.writing;

function rgbaWriting(a: number): string {
  const h = WRITING.accent.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

/**
 * Writing Room — a calm companion launcher, not a wall of cards. The companion
 * is front and centre (like Home) with the ways to write orbiting it: a note,
 * a voice note, your saved notes, letters, and the one chip we keep everywhere.
 * Recording happens in an overlay so the room stays uncluttered.
 */
export default function JournalScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const { mutate: addVoice } = useAddVoiceNote();

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
          "Voice notes need mic access. You can also dictate into a text note with your keyboard mic.",
        );
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Full audio-session config: without an explicit interruption mode, iOS
      // can refuse to activate a recording session while another app holds audio.
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
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (e) {
      console.error("[journal] startRecording failed:", e);
      Alert.alert(
        "Could not start recording",
        e instanceof Error ? e.message : "Please try again.",
      );
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
              Alert.alert("Could not save", e instanceof Error ? e.message : "Try again."),
          },
        );
      }
    } catch {
      setRecording(null);
      setRecordSeconds(0);
    }
  };

  const { data: notes = [] } = useJournalNotes();
  const recentNotes = notes.slice(0, 3);
  const companionTop = 58;

  return (
    <SafeArea bottom={false}>
      <ZoneGlow zone="writing" />

      <View className="px-6 pt-5 pb-1 flex-row items-start gap-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="p-1 -ml-1 mt-1 active:opacity-60"
        >
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary text-4xl tracking-tight" style={headingShadow}>
            Writing Room
          </Text>
          <Text className="text-text-secondary text-base mt-1">
            Written or spoken. Yours alone.
          </Text>
        </View>
      </View>

      {/* Companion front and centre. Three ways to write orbit her — Voice note
          above, A note left, Letters right — with "I want a drink" tucked below,
          sitting clear of the journal in her hands. Your saved notes live in the
          page underneath, an archive rather than an orbit action. */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 408, position: "relative", marginTop: 6 }}>
          <View
            style={{ position: "absolute", left: 0, right: 0, top: companionTop, alignItems: "center" }}
            pointerEvents="none"
          >
            <CompanionArt source={pose("journal")} width={250} height={298} />
          </View>

          <View style={{ position: "absolute", left: 0, right: 0, top: companionTop - 46, alignItems: "center", zIndex: 10 }}>
            <OrbitChip label="Voice note" accent={WRITING.accent} onPress={startRecording} />
          </View>
          <View style={{ position: "absolute", left: 18, top: companionTop + 116, zIndex: 10 }}>
            <OrbitChip label="A note" accent={WRITING.accent} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/journal/write" as any); }} />
          </View>
          <View style={{ position: "absolute", right: 18, top: companionTop + 116, zIndex: 10 }}>
            <OrbitChip label="Letters" accent={WRITING.accent} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/letters/write" as any); }} />
          </View>

          <View style={{ position: "absolute", left: 0, right: 0, top: companionTop + 302, alignItems: "center", zIndex: 10 }}>
            <OrbitChip
              label={ZONES.urge.label}
              emergency
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                router.push(ZONES.urge.route as any);
              }}
            />
          </View>
        </View>

        {/* Your notes — the archive, in the page rather than in the orbit. */}
        <View style={{ paddingHorizontal: 24, marginTop: 2 }}>
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-text-primary text-xl font-semibold">Your notes</Text>
            {notes.length > 0 ? (
              <Pressable onPress={() => router.push("/journal/notes" as any)} hitSlop={8} className="active:opacity-60">
                <Text className="text-sm font-semibold" style={{ color: WRITING.accent }}>See all</Text>
              </Pressable>
            ) : null}
          </View>
          {recentNotes.length === 0 ? (
            <Text className="text-text-muted text-sm leading-relaxed">
              Notes and voice notes you keep will gather here.
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {recentNotes.map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() => router.push("/journal/notes" as any)}
                  className="flex-row items-center gap-3 rounded-2xl px-3.5 py-2.5 active:opacity-80"
                  style={{ backgroundColor: rgbaWriting(0.07), borderWidth: 1, borderColor: rgbaWriting(0.2) }}
                >
                  <Feather name={note.audio_path ? "mic" : "edit-3"} size={16} color={WRITING.accent} />
                  <Text className="flex-1 text-text-secondary text-sm" numberOfLines={1}>
                    {note.audio_path
                      ? `Voice note · ${formatDuration(note.duration_seconds ?? 0)}`
                      : (note.text?.trim() || "Untitled note")}
                  </Text>
                  <Text className="text-text-muted text-xs">{relativeDay(note.created_at)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Recording overlay — voice capture without leaving the room. */}
      {recording && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(11,9,15,0.82)", alignItems: "center", justifyContent: "center", zIndex: 50 }}
        >
          <View className="items-center bg-surface-2 rounded-3xl px-8 py-8 border border-white/10" style={{ width: 280 }}>
            <View className="w-3.5 h-3.5 rounded-full bg-danger-light mb-4" />
            <Text className="text-text-primary text-4xl font-semibold mb-1">
              {formatDuration(recordSeconds)}
            </Text>
            <Text className="text-text-muted text-sm mb-7">Recording…</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => stopRecording(false)}
                className="px-6 py-3 rounded-xl bg-surface border border-white/10 active:opacity-70"
              >
                <Text className="text-text-secondary text-sm font-semibold">Discard</Text>
              </Pressable>
              <Pressable
                onPress={() => stopRecording(true)}
                className="px-6 py-3 rounded-xl bg-accent active:opacity-80"
              >
                <Text className="text-bg text-sm font-semibold">Save note</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeArea>
  );
}
