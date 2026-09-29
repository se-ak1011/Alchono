import React, { useRef, useState } from 'react';
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
  PanResponder,
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
const EDIT_UI = 'rgba(164,137,222,0.98)';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

type EnvPos = { x: number; y: number; rot: number };

// The four envelopes on the desk = the delivery timing. x/y are the label's
// top-left as a fraction of the screen; rot is degrees. Placed roughly — use the
// in-app editor (pencil) to drag + rotate onto the drawn envelopes, then Export.
const ENVELOPES: { key: DeliveryChoice; label: string; init: EnvPos }[] = [
  { key: '30d', label: '30 days', init: { x: 0.06, y: 0.46, rot: 0 } },
  { key: '90d', label: '90 days', init: { x: 0.30, y: 0.45, rot: 0 } },
  { key: '6m', label: '6 months', init: { x: 0.54, y: 0.45, rot: 0 } },
  { key: '1y', label: '1 year', init: { x: 0.80, y: 0.46, rot: 0 } },
];

type PaperZone = { left: number; top: number; width: number; height: number };
const PAPER_INIT: PaperZone = { left: 0.13, top: 0.575, width: 0.72, height: 0.25 };

/** One envelope label. Self-contained so its drag reads live props via refs. */
function EnvelopeLabel({
  label,
  pos,
  editing,
  active,
  selected,
  width,
  height,
  onSelect,
  onMove,
  onTap,
}: {
  label: string;
  pos: EnvPos;
  editing: boolean;
  active: boolean;
  selected: boolean;
  width: number;
  height: number;
  onSelect: () => void;
  onMove: (p: EnvPos) => void;
  onTap: () => void;
}) {
  const editingRef = useRef(editing); editingRef.current = editing;
  const dimRef = useRef({ width, height }); dimRef.current = { width, height };
  const posRef = useRef(pos); posRef.current = pos;
  const start = useRef(pos);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editingRef.current,
      onMoveShouldSetPanResponder: () => editingRef.current,
      onMoveShouldSetPanResponderCapture: () => editingRef.current,
      onPanResponderGrant: () => { onSelect(); start.current = posRef.current; },
      onPanResponderMove: (_, g) => {
        onMove({
          rot: posRef.current.rot,
          x: clamp(start.current.x + g.dx / dimRef.current.width, -0.1, 0.96),
          y: clamp(start.current.y + g.dy / dimRef.current.height, 0.02, 0.96),
        });
      },
    }),
  ).current;

  return (
    <View
      {...(editing ? pan.panHandlers : {})}
      style={{
        position: 'absolute',
        left: pos.x * width,
        top: pos.y * height,
        transform: [{ rotate: `${pos.rot}deg` }],
      }}
    >
      <Pressable
        onPress={editing ? onSelect : onTap}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <Text style={{ fontFamily: 'PatrickHand', fontSize: 14, color: active && !editing ? SELECT : INK }}>
          {label}
        </Text>
      </Pressable>
      {editing && selected ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderWidth: 1.5, borderColor: EDIT_UI, borderStyle: 'dashed', borderRadius: 6 }} />
      ) : null}
      {active && !editing ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderWidth: 2, borderColor: SELECT, borderRadius: 6 }} />
      ) : null}
    </View>
  );
}

export default function WriteLetterScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [body, setBody] = useState('');
  const [choice, setChoice] = useState<DeliveryChoice | null>(null);
  const { mutate: write, isPending } = useWriteLetter();

  // ----- editor state -----
  const [editing, setEditing] = useState(false);
  const [envs, setEnvs] = useState<Record<string, EnvPos>>(
    () => Object.fromEntries(ENVELOPES.map((e) => [e.key, e.init])),
  );
  const [paper, setPaper] = useState<PaperZone>(PAPER_INIT);
  const [fontScale, setFontScale] = useState(1);
  const [selected, setSelected] = useState<string | 'paper' | null>(null);
  const [showExport, setShowExport] = useState(false);

  // refs for the paper move/resize PanResponders (created once).
  const editingRef = useRef(editing); editingRef.current = editing;
  const dimRef = useRef({ width, height }); dimRef.current = { width, height };
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
          left: clamp(paperStart.current.left + g.dx / dimRef.current.width, -0.1, 0.9),
          top: clamp(paperStart.current.top + g.dy / dimRef.current.height, 0.04, 0.92),
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
          width: clamp(paperStart.current.width + g.dx / dimRef.current.width, 0.15, 1),
          height: clamp(paperStart.current.height + g.dy / dimRef.current.height, 0.08, 0.9),
        });
      },
      onPanResponderRelease: () => { resizingRef.current = false; },
      onPanResponderTerminate: () => { resizingRef.current = false; },
    }),
  ).current;

  const rotateSelected = (delta: number) => {
    if (!selected || selected === 'paper') return;
    Haptics.selectionAsync();
    setEnvs((prev) => ({ ...prev, [selected]: { ...prev[selected], rot: +(prev[selected].rot + delta).toFixed(1) } }));
  };

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

  const exportText = [
    'ENVELOPES:',
    ...ENVELOPES.map((e) => `  ${e.key}: x ${envs[e.key].x.toFixed(3)}, y ${envs[e.key].y.toFixed(3)}, rot ${envs[e.key].rot}`),
    `PAPER: left ${paper.left.toFixed(3)}, top ${paper.top.toFixed(3)}, w ${paper.width.toFixed(3)}, h ${paper.height.toFixed(3)}, font ${fontScale.toFixed(2)}`,
  ].join('\n');

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined} style={{ flex: 1 }}>
        <ImageBackground source={require('../../assets/scenes/letters_desk.png')} style={{ width, height }} resizeMode="cover">
          {/* Envelopes = when it's delivered (drag + rotate in edit mode). */}
          {ENVELOPES.map((e) => (
            <EnvelopeLabel
              key={e.key}
              label={e.label}
              pos={envs[e.key]}
              editing={editing}
              active={choice === e.key}
              selected={selected === e.key}
              width={width}
              height={height}
              onSelect={() => setSelected(e.key)}
              onMove={(p) => setEnvs((prev) => ({ ...prev, [e.key]: p }))}
              onTap={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setChoice(e.key); }}
            />
          ))}

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
            style={{ position: 'absolute', left: paper.left * width, top: paper.top * height, width: paper.width * width, height: paper.height * height, color: INK, fontFamily: 'PatrickHand', fontSize: 18 * fontScale, lineHeight: 24 * fontScale }}
          />

          {/* Paper drag/resize overlay — only in edit mode. */}
          {editing ? (
            <View
              {...paperMove.panHandlers}
              style={{ position: 'absolute', left: paper.left * width, top: paper.top * height, width: paper.width * width, height: paper.height * height }}
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

      {/* Quiet hint until they've picked a time (view mode only). */}
      {!choice && !editing ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: height * 0.53, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(236,233,241,0.6)', fontFamily: 'PatrickHand', fontSize: 13 }}>
            pick an envelope for when it arrives
          </Text>
        </View>
      ) : null}

      {/* Editor controls — rotate the selected envelope, resize hint, export. */}
      {editing ? (
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 30, backgroundColor: 'rgba(20,17,28,0.97)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, gap: 10 }}>
          <Text style={{ color: '#ECE9F1', fontSize: 12.5 }}>
            {selected === 'paper'
              ? 'Paper selected — drag to move, corner to resize.'
              : selected
                ? `${ENVELOPES.find((e) => e.key === selected)?.label} selected — drag to move, rotate below.`
                : 'Tap an envelope or the paper to select. Drag to place.'}
          </Text>

          {/* Rotate — envelope only. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: selected && selected !== 'paper' ? 1 : 0.35 }}>
            <Text style={{ color: '#ECE9F1', fontSize: 13, fontWeight: '600' }}>Rotate</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {[-15, -3, 3, 15].map((d) => (
                <Pressable key={d} onPress={() => rotateSelected(d)} hitSlop={6} style={{ paddingHorizontal: 10, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={{ color: '#ECE9F1', fontSize: 13 }}>{d > 0 ? `+${d}` : d}°</Text>
                </Pressable>
              ))}
            </View>
          </View>

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
