import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useWriteLetter, DELIVERY_OPTIONS, type DeliveryChoice } from '@/hooks/useLetters';

/**
 * The letter paper — just the letter to your future self. The delivery time is
 * now chosen on the writing desk (the envelopes in the index box) and arrives
 * here as the `choice` param; this screen is only the writing + sealing. The
 * paper area is positionable in the pencil editor (move / resize / text size),
 * then exported + baked.
 */
const INK = '#3a2f28';
const INK_SOFT = 'rgba(58,47,40,0.42)';
const SELECT = '#5b3fa0';
const EDIT_UI = 'rgba(164,137,222,0.98)';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

type PaperZone = { left: number; top: number; width: number; height: number };
const PAPER_INIT: PaperZone = { left: 0.14, top: 0.22, width: 0.72, height: 0.52 };
const LETTER = require('../../assets/folder/writing-letter.png');

export default function WriteLetterScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  // Cover-fit geometry so the paper zone anchors to the drawing, not the screen.
  const _src = Image.resolveAssetSource(LETTER);
  const imgW = _src?.width || width;
  const imgH = _src?.height || height;
  const _scale = Math.max(width / imgW, height / imgH);
  const dispW = imgW * _scale;
  const dispH = imgH * _scale;
  const offX = (width - dispW) / 2;
  const offY = (height - dispH) / 2;
  const { choice: choiceParam } = useLocalSearchParams<{ choice?: string }>();
  const choice = (DELIVERY_OPTIONS.find((o) => o.key === choiceParam)?.key ?? null) as DeliveryChoice | null;
  const choiceLabel = DELIVERY_OPTIONS.find((o) => o.key === choice)?.label;

  const [body, setBody] = useState('');
  const { mutate: write, isPending } = useWriteLetter();

  // ----- paper editor state -----
  const [editing, setEditing] = useState(false);
  const [paper, setPaper] = useState<PaperZone>(PAPER_INIT);
  const [fontScale, setFontScale] = useState(1);
  const [selected, setSelected] = useState<'paper' | null>(null);
  const [showExport, setShowExport] = useState(false);

  const editingRef = useRef(editing); editingRef.current = editing;
  const dimRef = useRef({ dispW, dispH }); dimRef.current = { dispW, dispH };
  const paperRef = useRef(paper); paperRef.current = paper;
  const paperStart = useRef(paper);
  const resizingRef = useRef(false);

  const paperMove = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editingRef.current,
      onMoveShouldSetPanResponder: () => editingRef.current && !resizingRef.current,
      onMoveShouldSetPanResponderCapture: () => editingRef.current && !resizingRef.current,
      onPanResponderGrant: () => { setSelected('paper'); paperStart.current = paperRef.current; },
      onPanResponderMove: (_, g) => {
        setPaper({
          ...paperRef.current,
          left: clamp(paperStart.current.left + g.dx / dimRef.current.dispW, -0.1, 0.9),
          top: clamp(paperStart.current.top + g.dy / dimRef.current.dispH, 0.04, 0.92),
        });
      },
    }),
  ).current;

  const paperResize = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => { resizingRef.current = true; paperStart.current = paperRef.current; },
      onPanResponderMove: (_, g) => {
        setPaper({
          ...paperRef.current,
          width: clamp(paperStart.current.width + g.dx / dimRef.current.dispW, 0.15, 1),
          height: clamp(paperStart.current.height + g.dy / dimRef.current.dispH, 0.08, 0.9),
        });
      },
      onPanResponderRelease: () => { resizingRef.current = false; },
      onPanResponderTerminate: () => { resizingRef.current = false; },
    }),
  ).current;

  const canSend = body.trim().length > 0 && !!choice && !isPending && !editing;

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

  const exportText = `PAPER: left ${paper.left.toFixed(3)}, top ${paper.top.toFixed(3)}, w ${paper.width.toFixed(3)}, h ${paper.height.toFixed(3)}, font ${fontScale.toFixed(2)}`;

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined} style={{ flex: 1 }}>
        <ImageBackground source={LETTER} style={{ width, height }} resizeMode="cover">
          {/* The paper = the letter body. */}
          <TextInput
            value={body}
            onChangeText={setBody}
            editable={!editing}
            placeholder="Dear Future You…"
            placeholderTextColor={INK_SOFT}
            multiline
            maxLength={4000}
            selectionColor={SELECT}
            textAlignVertical="top"
            style={{ position: 'absolute', left: offX + paper.left * dispW, top: offY + paper.top * dispH, width: paper.width * dispW, height: paper.height * dispH, color: INK, fontFamily: 'PatrickHand', fontSize: 18 * fontScale, lineHeight: 24 * fontScale }}
          />

          {/* Paper drag/resize overlay — only in edit mode. */}
          {editing ? (
            <View
              {...paperMove.panHandlers}
              style={{ position: 'absolute', left: offX + paper.left * dispW, top: offY + paper.top * dispH, width: paper.width * dispW, height: paper.height * dispH }}
            >
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: EDIT_UI, borderStyle: 'dashed', backgroundColor: selected === 'paper' ? 'rgba(164,137,222,0.10)' : 'transparent' }} />
              <View {...paperResize.panHandlers} style={{ position: 'absolute', right: -14, bottom: -14, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: EDIT_UI }}>
                <Feather name="maximize-2" size={15} color="#141019" />
              </View>
            </View>
          ) : null}
        </ImageBackground>
      </KeyboardAvoidingView>

      {/* Close (x) — always. */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: 'absolute', top: 52, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,11,18,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }}
      >
        <Feather name="x" size={20} color="#ECE9F1" />
      </Pressable>

      {/* Editor pencil toggle. */}
      <Pressable
        onPress={() => { setEditing((v) => !v); setShowExport(false); setSelected(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        hitSlop={10}
        style={{ position: 'absolute', top: 52, right: editing ? 16 : 74, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: editing ? EDIT_UI : 'rgba(13,11,18,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }}
      >
        <Feather name={editing ? 'check' : 'edit-2'} size={19} color={editing ? '#141019' : '#ECE9F1'} />
      </Pressable>

      {/* Seal it — hidden while editing. */}
      {!editing ? (
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
      ) : null}

      {/* Which future it's bound for (from the desk). */}
      {!editing ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(236,233,241,0.65)', fontFamily: 'PatrickHand', fontSize: 13 }}>
            {choiceLabel ? `arrives in ${choiceLabel}` : 'pick a time on the desk first'}
          </Text>
        </View>
      ) : null}

      {/* Editor controls — paper move/resize/text-size + export. */}
      {editing ? (
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 30, backgroundColor: 'rgba(20,17,28,0.97)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, gap: 10 }}>
          <Text style={{ color: '#ECE9F1', fontSize: 12.5 }}>Drag the paper to move, corner to resize.</Text>

          {/* Text size — paper. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#ECE9F1', fontSize: 13, fontWeight: '600' }}>Text size</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable onPress={() => setFontScale((s) => clamp(+(s - 0.05).toFixed(2), 0.6, 2))} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#ECE9F1', fontSize: 20 }}>−</Text>
              </Pressable>
              <Text style={{ color: '#ECE9F1', fontSize: 14, width: 44, textAlign: 'center' }}>{fontScale.toFixed(2)}×</Text>
              <Pressable onPress={() => setFontScale((s) => clamp(+(s + 0.05).toFixed(2), 0.6, 2))} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#ECE9F1', fontSize: 20 }}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => setShowExport((v) => !v)} style={{ borderRadius: 8, paddingVertical: 9, alignItems: 'center', backgroundColor: EDIT_UI }}>
            <Text style={{ color: '#141019', fontSize: 13, fontWeight: '700' }}>{showExport ? 'Hide' : 'Export coordinates'}</Text>
          </Pressable>
          {showExport ? (
            <Text selectable style={{ color: '#C9C2D6', fontSize: 12, lineHeight: 18 }}>{exportText}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
