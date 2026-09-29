import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useWriteLetter, type DeliveryChoice } from '@/hooks/useLetters';

// Ink colour for writing on the cream paper/envelopes.
const INK = '#3a2f28';
const INK_SOFT = 'rgba(58,47,40,0.42)';
const SELECT = '#5b3fa0';

// The four envelopes on the desk = the delivery timing. Positions are fractions
// of the screen over the drawn envelopes — rough for now (no in-app tuner on
// this screen), nudge against a screenshot.
const ENVELOPES: { key: DeliveryChoice; label: string; x: number; y: number; w: number; h: number }[] = [
  { key: '30d', label: '30 days', x: 0.0, y: 0.44, w: 0.2, h: 0.085 },
  { key: '90d', label: '90 days', x: 0.245, y: 0.435, w: 0.2, h: 0.085 },
  { key: '6m', label: '6 months', x: 0.5, y: 0.435, w: 0.2, h: 0.085 },
  { key: '1y', label: '1 year', x: 0.76, y: 0.44, w: 0.2, h: 0.085 },
];

// The sheet of paper in the middle → the letter body.
const PAPER = { left: 0.13, top: 0.575, width: 0.72, height: 0.25 };

export default function WriteLetterScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [body, setBody] = useState('');
  const [choice, setChoice] = useState<DeliveryChoice | null>(null);
  const { mutate: write, isPending } = useWriteLetter();

  const canSend = body.trim().length > 0 && !!choice && !isPending;

  const handleSend = () => {
    if (!canSend || !choice) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    write(
      { body, choice },
      {
        onSuccess: () =>
          Alert.alert('Sealed.', 'Future You will hear from you when the time comes.', [
            { text: 'Okay', onPress: () => router.back() },
          ]),
        onError: () => Alert.alert('Could not save', 'Please try again in a moment.'),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined} style={{ flex: 1 }}>
        <ImageBackground source={require('../../assets/scenes/letters_desk.png')} style={{ width, height }} resizeMode="cover">
          {/* Envelopes = when it's delivered. */}
          {ENVELOPES.map((e) => {
            const active = choice === e.key;
            return (
              <Pressable
                key={e.key}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setChoice(e.key); }}
                style={{ position: 'absolute', left: e.x * width, top: e.y * height, width: e.w * width, height: e.h * height, alignItems: 'center', justifyContent: 'center' }}
              >
                {active ? (
                  <View pointerEvents="none" style={{ position: 'absolute', top: -4, left: 6, right: 6, bottom: -4, borderRadius: 8, borderWidth: 2, borderColor: SELECT }} />
                ) : null}
                <Text style={{ fontFamily: 'PatrickHand', fontSize: 13, color: active ? SELECT : INK }}>{e.label}</Text>
              </Pressable>
            );
          })}

          {/* The paper = the letter. */}
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Dear Future You…"
            placeholderTextColor={INK_SOFT}
            multiline
            maxLength={4000}
            selectionColor={SELECT}
            textAlignVertical="top"
            style={{ position: 'absolute', left: PAPER.left * width, top: PAPER.top * height, width: PAPER.width * width, height: PAPER.height * height, color: INK, fontFamily: 'PatrickHand', fontSize: 18, lineHeight: 24 }}
          />
        </ImageBackground>
      </KeyboardAvoidingView>

      {/* Fixed controls — stay put when the keyboard lifts the desk. */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: 'absolute', top: 52, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,11,18,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }}
      >
        <Feather name="x" size={20} color="#ECE9F1" />
      </Pressable>
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={{ position: 'absolute', top: 54, right: 16, paddingHorizontal: 18, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: canSend ? '#A489DE' : 'rgba(30,26,38,0.7)', borderWidth: 1, borderColor: canSend ? 'transparent' : 'rgba(255,255,255,0.12)' }}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#201D28" />
        ) : (
          <Text style={{ color: canSend ? '#201D28' : '#817B91', fontWeight: '700', fontSize: 14 }}>Seal it</Text>
        )}
      </Pressable>

      {/* A quiet hint until they've picked a time. */}
      {!choice ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: height * 0.53, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(236,233,241,0.6)', fontFamily: 'PatrickHand', fontSize: 13 }}>
            pick an envelope for when it arrives
          </Text>
        </View>
      ) : null}
    </View>
  );
}
