import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { useRouter } from "expo-router";
import { DrawnForm, AreaZone, type Rect } from "@/components/paper/DrawnForm";
import { useAddVoiceNote } from "@/hooks/useJournalNotes";

/**
 * Voice note — the dictaphone from the writing desk. Press the red button to
 * record, press again (same button) to stop + save; the stop button discards.
 * The timer shows on the recorder's LCD. The three taps are positionable zones,
 * placed over the drawn buttons in the pencil editor, then exported + baked.
 */
const voiceImg = require("../../assets/folder/writing-voice.png");

const R = {
  v_screen: { x: 0.3, y: 0.22, w: 0.4, h: 0.12 } as Rect, // over the LCD
  v_rec: { x: 0.42, y: 0.5, w: 0.16, h: 0.08 } as Rect, // over the red record button
  v_stop: { x: 0.26, y: 0.48, w: 0.12, h: 0.08 } as Rect, // over the stop button
} as const;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VoiceNoteScreen() {
  const router = useRouter();
  const { mutate: addVoice } = useAddVoiceNote();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // A pulse on the live red dot while recording.
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
  const onBack = () => (isRecording ? stopRecording(false) : router.back());

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <DrawnForm source={voiceImg} label="writing-voice" onBack={onBack}>
        {/* The dictaphone's LCD — status + timer. */}
        <AreaZone id="v_screen" rect={R.v_screen}>
          <View pointerEvents="none" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            {isRecording ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E5646E" }, recDot]} />
                  <Text style={{ color: "#2a3326", fontSize: 11, fontFamily: "PatrickHand" }}>REC</Text>
                </View>
                <Text style={{ color: "#2a3326", fontSize: 22, fontFamily: "PatrickHand", fontVariant: ["tabular-nums"] }}>{formatDuration(recordSeconds)}</Text>
              </>
            ) : (
              <Text style={{ color: "#2a3326", fontSize: 13, fontFamily: "PatrickHand", textAlign: "center" }}>Press ● to record</Text>
            )}
          </View>
        </AreaZone>

        {/* The red record button — start; press again to stop + save. */}
        <AreaZone id="v_rec" rect={R.v_rec}>
          <Pressable
            disabled={saving}
            onPress={() => (isRecording ? stopRecording(true) : startRecording())}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? "Stop and save" : "Start recording"}
            style={{ flex: 1 }}
          />
        </AreaZone>

        {/* The stop button — discard while recording. */}
        <AreaZone id="v_stop" rect={R.v_stop}>
          <Pressable onPress={() => isRecording && stopRecording(false)} accessibilityLabel="Discard" style={{ flex: 1 }} />
        </AreaZone>
      </DrawnForm>
    </View>
  );
}
