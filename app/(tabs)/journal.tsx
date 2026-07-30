import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Alert } from "react-native";
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
import { useAddVoiceNote } from "@/hooks/useJournalNotes";
import { ZONES } from "@/lib/zones";
import { headingShadow } from "@/styles";

const WRITING = ZONES.writing;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
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

  const companionTop = 92;
  const positions = [
    { left: 14, right: undefined, top: companionTop - 30 }, // Write
    { left: undefined, right: 14, top: companionTop - 30 }, // Voice note
    { left: 10, right: undefined, top: companionTop + 120 }, // Your notes
    { left: undefined, right: 8, top: companionTop + 120 }, // Letters
  ];

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

      {/* Companion front and centre, ways to write orbiting it. */}
      <View style={{ flex: 1, position: "relative" }}>
        <View
          style={{ position: "absolute", left: 0, right: 0, top: companionTop, alignItems: "center" }}
          pointerEvents="none"
        >
          <CompanionArt source={pose("bust")} width={236} height={280} cropHeight={220} />
        </View>

        <View style={{ position: "absolute", left: positions[0].left, top: positions[0].top, zIndex: 10 }}>
          <OrbitChip label="A note" accent={WRITING.accent} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/journal/write" as any); }} />
        </View>
        <View style={{ position: "absolute", right: positions[1].right, top: positions[1].top, zIndex: 10 }}>
          <OrbitChip label="Voice note" accent={WRITING.accent} onPress={startRecording} />
        </View>
        <View style={{ position: "absolute", left: positions[2].left, top: positions[2].top, zIndex: 10 }}>
          <OrbitChip label={"Your\nnotes"} accent={WRITING.accent} numberOfLines={2} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/journal/notes" as any); }} />
        </View>
        <View style={{ position: "absolute", right: positions[3].right, top: positions[3].top, zIndex: 10 }}>
          <OrbitChip label="Letters" accent={WRITING.accent} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/letters/write" as any); }} />
        </View>

        <View style={{ position: "absolute", left: 0, right: 0, top: companionTop + 208, alignItems: "center", zIndex: 10 }}>
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
