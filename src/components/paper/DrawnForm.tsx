import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ImageBackground,
  PanResponder,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/authStore';

/**
 * Drawn-form engine — overlay invisible, tunable zones onto a HAND-DRAWN paper
 * so administrative pages (My circumstances, hobbies, the folder, the settings
 * "consent form"…) read as filling in a real document, not an app.
 *
 * Marta draws the paper with the field lines, tick-boxes and labels printed in.
 * The page declares <FieldZone>/<TickZone>/<UsernameZone> bound to the real
 * data, with rough default rects. The pencil turns on edit mode: drag each zone
 * onto its spot, resize with the corner, Export — then Claude bakes the rects.
 * Same art→coordinates workflow as the rooms, books and letters.
 */
const INK = '#332a24';
const INK_SOFT = 'rgba(51,42,36,0.5)';
const EDIT_UI = 'rgba(164,137,222,0.98)';
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export type Rect = { x: number; y: number; w: number; h: number };

type Ctx = {
  editing: boolean;
  editingRef: React.MutableRefObject<boolean>;
  get: (id: string) => Rect | undefined;
  set: (id: string, r: Rect) => void;
  register: (id: string, def: Rect) => void;
  selected: string | null;
  select: (id: string | null) => void;
  W: number;
  H: number;
};
const FormCtx = createContext<Ctx | null>(null);

/** Positioned, draggable/resizable wrapper every zone sits in. */
function Zone({ id, def, children }: { id: string; def: Rect; children: React.ReactNode }) {
  const ctx = useContext(FormCtx);
  if (!ctx) return <>{children}</>;

  const rect = ctx.get(id) ?? def;
  const rectRef = useRef(rect); rectRef.current = rect;
  const start = useRef(rect);
  const resizing = useRef(false);
  const dim = useRef({ W: ctx.W, H: ctx.H }); dim.current = { W: ctx.W, H: ctx.H };

  useEffect(() => { ctx.register(id, def); }, [id]);

  const move = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => ctx.editingRef.current,
      onMoveShouldSetPanResponder: () => ctx.editingRef.current && !resizing.current,
      onMoveShouldSetPanResponderCapture: () => ctx.editingRef.current && !resizing.current,
      onPanResponderGrant: () => { ctx.select(id); start.current = rectRef.current; },
      onPanResponderMove: (_, g) => {
        ctx.set(id, {
          ...rectRef.current,
          x: clamp(start.current.x + g.dx / dim.current.W, -0.1, 0.96),
          y: clamp(start.current.y + g.dy / dim.current.H, 0, 0.97),
        });
      },
    }),
  ).current;

  const resize = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => { resizing.current = true; start.current = rectRef.current; },
      onPanResponderMove: (_, g) => {
        ctx.set(id, {
          ...rectRef.current,
          w: clamp(start.current.w + g.dx / dim.current.W, 0.04, 1),
          h: clamp(start.current.h + g.dy / dim.current.H, 0.02, 0.7),
        });
      },
      onPanResponderRelease: () => { resizing.current = false; },
      onPanResponderTerminate: () => { resizing.current = false; },
    }),
  ).current;

  const sel = ctx.selected === id && ctx.editing;

  return (
    <View
      {...(ctx.editing ? move.panHandlers : {})}
      style={{ position: 'absolute', left: rect.x * ctx.W, top: rect.y * ctx.H, width: rect.w * ctx.W, height: rect.h * ctx.H }}
    >
      {children}
      {ctx.editing ? (
        <>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: sel ? EDIT_UI : 'rgba(164,137,222,0.4)', borderStyle: 'dashed', backgroundColor: sel ? 'rgba(164,137,222,0.10)' : 'transparent' }} />
          {sel ? (
            <View {...resize.panHandlers} style={{ position: 'absolute', right: -13, bottom: -13, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: EDIT_UI }}>
              <Feather name="maximize-2" size={13} color="#141019" />
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/** A written field — ink on the drawn line. */
export function FieldZone({
  id,
  rect,
  value,
  onChangeText,
  placeholder,
  multiline,
  fontSize = 18,
  align = 'left',
}: {
  id: string;
  rect: Rect;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  fontSize?: number;
  align?: 'left' | 'center';
}) {
  const ctx = useContext(FormCtx);
  const editing = ctx?.editing ?? false;
  return (
    <Zone id={id} def={rect}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={!editing}
        placeholder={placeholder}
        placeholderTextColor={INK_SOFT}
        multiline={multiline}
        selectionColor="#6b4f9e"
        textAlign={align}
        style={{ flex: 1, color: INK, fontFamily: 'PatrickHand', fontSize, padding: 0, paddingHorizontal: 2, textAlignVertical: multiline ? 'top' : 'center' }}
      />
    </Zone>
  );
}

/** A tick-box or a circled choice — tap to mark. `mark` picks the style. */
export function TickZone({
  id,
  rect,
  value,
  onToggle,
  mark = 'check',
}: {
  id: string;
  rect: Rect;
  value: boolean;
  onToggle: () => void;
  mark?: 'check' | 'ring' | 'cross';
}) {
  const ctx = useContext(FormCtx);
  const editing = ctx?.editing ?? false;
  return (
    <Zone id={id} def={rect}>
      <Pressable
        onPress={() => {
          if (editing) { ctx?.select(id); return; }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        {value ? (
          mark === 'ring' ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderWidth: 2.5, borderColor: '#3a2f28', borderRadius: 999 }} />
          ) : (
            <Feather name={mark === 'cross' ? 'x' : 'check'} size={22} color="#3a2f28" />
          )
        ) : null}
      </Pressable>
    </Zone>
  );
}

/** The live @username, painted onto the folder's nameplate. */
export function UsernameZone({
  id,
  rect,
  prefix = '@',
  fontSize = 24,
  color = INK,
}: {
  id: string;
  rect: Rect;
  prefix?: string;
  fontSize?: number;
  color?: string;
}) {
  const username = useAuthStore((s) => s.profile?.username) ?? 'you';
  return (
    <Zone id={id} def={rect}>
      <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'PatrickHand', fontSize, color }}>
          {prefix}{username}
        </Text>
      </View>
    </Zone>
  );
}

/** The drawn paper + the zone overlay + the placement editor. */
export function DrawnForm({
  source,
  label,
  onBack,
  children,
}: {
  source: ImageSourcePropType;
  label: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(editing); editingRef.current = editing;
  const [map, setMap] = useState<Record<string, Rect>>({});
  const [ids, setIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const get = (id: string) => map[id];
  const set = (id: string, r: Rect) => setMap((m) => ({ ...m, [id]: r }));
  const register = (id: string, def: Rect) => {
    setIds((p) => (p.includes(id) ? p : [...p, id]));
    setMap((m) => (id in m ? m : { ...m, [id]: def }));
  };

  const ctx: Ctx = { editing, editingRef, get, set, register, selected, select: setSelected, W: width, H: height };

  const exportText = ids.length
    ? ids.map((id) => { const r = get(id) ?? { x: 0, y: 0, w: 0, h: 0 }; return `  ${id}: x ${r.x.toFixed(3)}, y ${r.y.toFixed(3)}, w ${r.w.toFixed(3)}, h ${r.h.toFixed(3)}`; }).join('\n')
    : '  (nothing placed yet)';

  return (
    <FormCtx.Provider value={ctx}>
      <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
        <ImageBackground source={source} style={{ width, height }} resizeMode="cover">
          {children}
        </ImageBackground>

        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={{ position: 'absolute', top: 52, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,11,18,0.4)', borderWidth: 1, borderColor: 'rgba(20,17,28,0.25)' }}>
            <Feather name="chevron-left" size={24} color="#3a2f28" />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => { setEditing((v) => !v); setSelected(null); setShowExport(false); }}
          hitSlop={10}
          style={{ position: 'absolute', top: 52, right: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: editing ? EDIT_UI : 'rgba(13,11,18,0.4)', borderWidth: 1, borderColor: 'rgba(20,17,28,0.25)' }}
        >
          <Feather name={editing ? 'check' : 'edit-2'} size={19} color={editing ? '#141019' : '#3a2f28'} />
        </Pressable>

        {editing ? (
          <View style={{ position: 'absolute', left: 12, right: 12, bottom: 30, backgroundColor: 'rgba(20,17,28,0.97)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, gap: 10 }}>
            <Text style={{ color: '#ECE9F1', fontSize: 12.5 }}>
              {selected ? `"${selected}" selected — drag to move, corner to resize.` : 'Tap a zone to select, then drag / resize.'}
            </Text>
            <Pressable onPress={() => setShowExport((v) => !v)} style={{ borderRadius: 8, paddingVertical: 9, alignItems: 'center', backgroundColor: EDIT_UI }}>
              <Text style={{ color: '#141019', fontSize: 13, fontWeight: '700' }}>{showExport ? 'Hide' : 'Export coordinates'}</Text>
            </Pressable>
            {showExport ? <Text selectable style={{ color: '#C9C2D6', fontSize: 12, lineHeight: 18 }}>{`${label}:\n${exportText}`}</Text> : null}
          </View>
        ) : null}
      </View>
    </FormCtx.Provider>
  );
}
