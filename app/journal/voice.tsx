import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { ZoneGlow } from "@/components/ui/ZoneGlow";
import { RoomBackdrop } from "@/components/ui/RoomBackdrop";
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
 * Voice note — the recorder you reach by tapping the little dictaphone on the
 * writing desk. A single big mic: press it to start, press again (or Save) to
 * keep it. Recording lives here so the desk hotspot has somewhere to land, and
 * uses exactly the same capture + save path as the Writing Room orbit chip.
 */
export default function VoiceNoteScreen() {
  const router = useRouter();
  const { mutate: addVoice } = useAddVoiceNote();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // A slow breathing pulse on the idle mic so it reads as "press me".
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const idleRing = useAnimatedStyle(() => ({
    opacity: 0.18 + pulse.value * 0.22,
    transform: [{ scale: 1 + pulse.value * 0.12 }],
  }));

  // A faster pulse on the live red dot while recording.
  const rec = useSharedValue(0);
  useEffect(() => {
    if (recording) {
      rec.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0, { duration: 600 })), -1, false);
    } else {
      rec.value = 0;
    }
  }, [recording, rec]);
  const recDot = useAnimatedStyle(() => ({ opacity: 0.4 + rec.value * 0.6 }));

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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording: r } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(r);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (e) {
      console.error("[voice] startRecording failed:", e);
      Alert.alert("Could not start recording", e instanceof Error ? e.message : "Please try again.");
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
        setSaving(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addVoice(
          { localUri: uri, durationSeconds: seconds },
          {
            onSuccess: () => router.back(),
            onError: (e) => {
              setSaving(false);
              Alert.alert("Could not save", e instanceof Error ? e.message : "Try again.");
            },
          },
        );
      }
    } catch {
      setRecording(null);
      setRecordSeconds(0);
    }
  };

  const isRecording = !!recording;

  return (
    <SafeArea bottom={false}>
      <ZoneGlow zone="writing" />
      <RoomBackdrop warmth={WRITING.accent} floor="#282232" lampTop={150} horizon={0.6} intensity={0.95} />

      <View className="px-6 pt-5 pb-1 flex-row items-start gap-3">
        <Pressable onPress={() => (isRecording ? stopRecording(false) : router.back())} hitSlop={12} className="p-1 -ml-1 mt-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary text-4xl tracking-tight" style={headingShadow}>
            Voice note
          </Text>
          <Text className="text-text-secondary text-base mt-1">
            {isRecording ? "Listening. Speak when you’re ready." : "Press the mic. Say it out loud."}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
        {/* Timer sits above the mic while recording. */}
        <View style={{ height: 64, alignItems: "center", justifyContent: "flex-end", marginBottom: 22 }}>
          {isRecording ? (
            <Animated.View entering={FadeIn.duration(200)} style={{ alignItems: "center" }}>
              <View className="flex-row items-center gap-2 mb-1">
                <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#E5646E" }, recDot]} />
                <Text className="text-text-muted text-sm">Recording…</Text>
              </View>
              <Text className="text-text-primary text-5xl font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
                {formatDuration(recordSeconds)}
              </Text>
            </Animated.View>
          ) : null}
        </View>

        {/* The mic — press to start. */}
        <Pressable
          onPress={() => (isRecording ? stopRecording(true) : startRecording())}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? "Stop and save" : "Start recording"}
          style={{ width: 168, height: 168, alignItems: "center", justifyContent: "center" }}
        >
          {!isRecording ? (
            <Animated.View
              pointerEvents="none"
              style={[{ position: "absolute", width: 168, height: 168, borderRadius: 84, backgroundColor: WRITING.accent }, idleRing]}
            />
          ) : null}
          <View
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isRecording ? "#E5646E" : WRITING.accent,
              shadowColor: "#000",
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <Feather name={isRecording ? "square" : "mic"} size={isRecording ? 44 : 52} color="#141019" />
          </View>
        </Pressable>

        {/* Discard while recording; hint while idle. */}
        <View style={{ height: 56, marginTop: 28, alignItems: "center", justifyContent: "flex-start" }}>
          {isRecording ? (
            <Pressable onPress={() => stopRecording(false)} hitSlop={8} className="px-6 py-3 rounded-xl active:opacity-70" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
              <Text className="text-text-secondary text-sm font-semibold">Discard</Text>
            </Pressable>
          ) : (
            <Text className="text-text-muted text-sm">Tap again to stop and save.</Text>
          )}
        </View>
      </View>
    </SafeArea>
  );
}
