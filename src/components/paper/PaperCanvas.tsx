import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, Keyboard, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * A lightweight placement editor for the "paper" pages (Tonight, A note, Your
 * notes, Recovery), where text flows top-to-bottom rather than sitting on a
 * drawn object. Wrap the page body in <PaperCanvas> and each heading / block in
 * <Placeable id="...">; the pencil (top-right) turns on edit mode, then each
 * block can be dragged, rotated and scaled, with Export to bake the numbers
 * back in as defaults. Off by default — in view mode children are fully
 * interactive and untouched.
 *
 * Placement is applied as a transform (translate + rotate + scale), so blocks
 * keep their normal flow position until moved and sibling layout is unaffected.
 */
export type Placement = { dx: number; dy: number; rot: number; scale: number };
const DEFAULT: Placement = { dx: 0, dy: 0, rot: 0, scale: 1 };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const EDIT_UI = 'rgba(164,137,222,0.98)';

type Ctx = {
  editing: boolean;
  editingRef: React.MutableRefObject<boolean>;
  get: (id: string) => Placement;
  set: (id: string, p: Placement) => void;
  register: (id: string) => void;
  selected: string | null;
  select: (id: string) => void;
};
const PaperCtx = createContext<Ctx | null>(null);

export function Placeable({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(PaperCtx);
  if (!ctx) return <>{children}</>;

  const p = ctx.get(id);
  const pRef = useRef(p); pRef.current = p;
  const start = useRef(p);

  useEffect(() => { ctx.register(id); }, [id]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => ctx.editingRef.current,
      onMoveShouldSetPanResponder: () => ctx.editingRef.current,
      onMoveShouldSetPanResponderCapture: () => ctx.editingRef.current,
      onPanResponderGrant: () => { ctx.select(id); start.current = pRef.current; },
      onPanResponderMove: (_, g) => {
        ctx.set(id, { ...pRef.current, dx: start.current.dx + g.dx, dy: start.current.dy + g.dy });
      },
    }),
  ).current;

  const sel = ctx.selected === id && ctx.editing;

  return (
    <View
      {...(ctx.editing ? pan.panHandlers : {})}
      style={{ transform: [{ translateX: p.dx }, { translateY: p.dy }, { rotate: `${p.rot}deg` }, { scale: p.scale }] }}
    >
      {children}
      {sel ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderWidth: 1.5, borderColor: EDIT_UI, borderStyle: 'dashed', borderRadius: 8 }} />
      ) : null}
    </View>
  );
}

export function PaperCanvas({ label, children, pencilTop = 52 }: { label: string; children: React.ReactNode; pencilTop?: number }) {
  const { width, height } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(editing); editingRef.current = editing;
  const [map, setMap] = useState<Record<string, Placement>>({});
  const [ids, setIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const get = (id: string) => map[id] ?? DEFAULT;
  const set = (id: string, p: Placement) => setMap((m) => ({ ...m, [id]: p }));
  const register = (id: string) => setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const patchSelected = (patch: Partial<Placement>) =>
    setMap((m) => (selected ? { ...m, [selected]: { ...(m[selected] ?? DEFAULT), ...patch } } : m));
  const rotate = (d: number) => selected && patchSelected({ rot: +(((map[selected] ?? DEFAULT).rot) + d).toFixed(1) });
  const scaleBy = (d: number) => selected && patchSelected({ scale: clamp(+(((map[selected] ?? DEFAULT).scale) + d).toFixed(2), 0.5, 2.5) });
  const resetSelected = () => selected && patchSelected(DEFAULT);

  const ctx: Ctx = { editing, editingRef, get, set, register, selected, select: setSelected };

  const exportText = ids.length
    ? ids
        .map((id) => {
          const t = get(id);
          return `  ${id}: dx ${(t.dx / width).toFixed(3)}, dy ${(t.dy / height).toFixed(3)}, rot ${t.rot}, scale ${t.scale}`;
        })
        .join('\n')
    : '  (nothing moved yet)';

  const selScale = selected ? (map[selected] ?? DEFAULT).scale : 1;
  const selRot = selected ? (map[selected] ?? DEFAULT).rot : 0;

  return (
    <PaperCtx.Provider value={ctx}>
      <View style={{ flex: 1 }}>{children}</View>

      {/* Pencil toggle. */}
      <Pressable
        onPress={() => { setEditing((v) => { if (!v) Keyboard.dismiss(); return !v; }); setSelected(null); setShowExport(false); }}
        hitSlop={10}
        style={{ position: 'absolute', top: pencilTop, right: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: editing ? EDIT_UI : 'rgba(13,11,18,0.45)', borderWidth: 1, borderColor: 'rgba(20,17,28,0.25)' }}
      >
        <Feather name={editing ? 'check' : 'edit-2'} size={19} color={editing ? '#141019' : '#3a2f28'} />
      </Pressable>

      {/* Controls — rotate + scale the selected block, export all. */}
      {editing ? (
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 30, backgroundColor: 'rgba(20,17,28,0.97)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, gap: 10 }}>
          <Text style={{ color: '#ECE9F1', fontSize: 12.5 }}>
            {selected ? `"${selected}" selected — drag to move.` : 'Tap a block to select, then drag / rotate / scale.'}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: selected ? 1 : 0.35 }}>
            <Text style={{ color: '#ECE9F1', fontSize: 13, fontWeight: '600' }}>Rotate {selected ? `${selRot}°` : ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {[-15, -3, 3, 15].map((d) => (
                <Pressable key={d} onPress={() => rotate(d)} hitSlop={6} style={{ paddingHorizontal: 10, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={{ color: '#ECE9F1', fontSize: 13 }}>{d > 0 ? `+${d}` : d}°</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: selected ? 1 : 0.35 }}>
            <Text style={{ color: '#ECE9F1', fontSize: 13, fontWeight: '600' }}>Size {selected ? `${selScale.toFixed(2)}×` : ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable onPress={() => scaleBy(-0.05)} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#ECE9F1', fontSize: 20 }}>−</Text>
              </Pressable>
              <Pressable onPress={() => scaleBy(0.05)} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#ECE9F1', fontSize: 20 }}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={resetSelected} disabled={!selected} style={{ flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: selected ? '#ECE9F1' : '#6b6676', fontSize: 13, fontWeight: '600' }}>Reset</Text>
            </Pressable>
            <Pressable onPress={() => setShowExport((v) => !v)} style={{ flex: 2, borderRadius: 8, paddingVertical: 9, alignItems: 'center', backgroundColor: EDIT_UI }}>
              <Text style={{ color: '#141019', fontSize: 13, fontWeight: '700' }}>{showExport ? 'Hide' : 'Export placement'}</Text>
            </Pressable>
          </View>
          {showExport ? (
            <Text selectable style={{ color: '#C9C2D6', fontSize: 12, lineHeight: 18 }}>{`${label}:\n${exportText}`}</Text>
          ) : null}
        </View>
      ) : null}
    </PaperCtx.Provider>
  );
}
