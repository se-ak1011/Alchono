import React, { useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, PanResponder, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";

/**
 * The reader pages (book articles, resource lists) sit in a text zone painted
 * over the drawn book. This wraps that zone with the same in-app tuning the hub
 * editor gives: toggle edit mode, drag the box to place it, drag the corner to
 * resize, step the font up/down — then Export the numbers to bake back into the
 * screen's PAGE / fontScale constants. Off by default; the pencil turns it on.
 */
export type PageZone = { left: number; top: number; width: number; height: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function PageTuner({
  label,
  defaultZone,
  defaultFontScale = 1,
  contentKey,
  scroll = true,
  children,
}: {
  label: string;
  defaultZone: PageZone;
  defaultFontScale?: number;
  /** Changing this re-mounts the scroll content (e.g. new article/tab). */
  contentKey?: string;
  /** false = the children manage their own layout/scroll (e.g. two page columns);
   *  the tuner just positions + sizes the box and supplies the font scale. */
  scroll?: boolean;
  children: (fontScale: number) => React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const [zone, setZone] = useState<PageZone>(defaultZone);
  const [fontScale, setFontScale] = useState(defaultFontScale);
  const [showExport, setShowExport] = useState(false);

  // Refs mirror state so the PanResponders (created once) read live values.
  const zoneRef = useRef(zone); zoneRef.current = zone;
  const editingRef = useRef(editing); editingRef.current = editing;
  const dim = useRef({ width, height }); dim.current = { width, height };
  const startZone = useRef<PageZone>(zone);

  const move = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => editingRef.current,
      // Capture so dragging wins over any scroll views inside the box.
      onMoveShouldSetPanResponderCapture: () => editingRef.current,
      onPanResponderGrant: () => { startZone.current = zoneRef.current; },
      onPanResponderMove: (_, g) => {
        setZone({
          ...zoneRef.current,
          left: clamp(startZone.current.left + g.dx / dim.current.width, -0.2, 0.9),
          top: clamp(startZone.current.top + g.dy / dim.current.height, 0.04, 0.92),
        });
      },
    }),
  ).current;

  const resize = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { startZone.current = zoneRef.current; },
      onPanResponderMove: (_, g) => {
        setZone({
          ...zoneRef.current,
          width: clamp(startZone.current.width + g.dx / dim.current.width, 0.15, 1),
          height: clamp(startZone.current.height + g.dy / dim.current.height, 0.08, 0.9),
        });
      },
    }),
  ).current;

  const box = {
    position: "absolute" as const,
    left: zone.left * width,
    top: zone.top * height,
    width: zone.width * width,
    height: zone.height * height,
  };

  return (
    <>
      <View style={box} {...(editing ? move.panHandlers : {})}>
        {scroll ? (
          <ScrollView
            key={contentKey}
            scrollEnabled={!editing}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {children(fontScale)}
          </ScrollView>
        ) : (
          <View key={contentKey} style={{ flex: 1 }}>
            {children(fontScale)}
          </View>
        )}

        {editing ? (
          <>
            <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: "rgba(164,137,222,0.9)", borderStyle: "dashed", backgroundColor: "rgba(164,137,222,0.08)" }} />
            <View {...resize.panHandlers} style={{ position: "absolute", right: -14, bottom: -14, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(164,137,222,0.98)" }}>
              <Feather name="maximize-2" size={15} color="#141019" />
            </View>
          </>
        ) : null}
      </View>

      {/* Pencil toggle, top-right. */}
      <Pressable
        onPress={() => { setEditing((e) => !e); setShowExport(false); }}
        hitSlop={10}
        style={{ position: "absolute", top: 52, right: 16, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: editing ? "rgba(164,137,222,0.95)" : "rgba(13,11,18,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}
      >
        <Feather name={editing ? "check" : "edit-2"} size={19} color={editing ? "#141019" : "#ECE9F1"} />
      </Pressable>

      {/* Font stepper + export, bottom, only while editing. */}
      {editing ? (
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 34, backgroundColor: "rgba(20,17,28,0.97)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 12, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#ECE9F1", fontSize: 13, fontWeight: "600" }}>Text size</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Pressable onPress={() => setFontScale((s) => clamp(+(s - 0.05).toFixed(2), 0.6, 2))} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" }}>
                <Text style={{ color: "#ECE9F1", fontSize: 20 }}>−</Text>
              </Pressable>
              <Text style={{ color: "#ECE9F1", fontSize: 14, width: 44, textAlign: "center" }}>{fontScale.toFixed(2)}×</Text>
              <Pressable onPress={() => setFontScale((s) => clamp(+(s + 0.05).toFixed(2), 0.6, 2))} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" }}>
                <Text style={{ color: "#ECE9F1", fontSize: 20 }}>+</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={() => setShowExport((v) => !v)} style={{ borderRadius: 8, paddingVertical: 9, alignItems: "center", backgroundColor: "rgba(164,137,222,0.9)" }}>
            <Text style={{ color: "#141019", fontSize: 13, fontWeight: "700" }}>{showExport ? "Hide" : "Export coordinates"}</Text>
          </Pressable>
          {showExport ? (
            <Text selectable style={{ color: "#C9C2D6", fontSize: 12, lineHeight: 18 }}>
              {label} — left {zone.left.toFixed(3)}, top {zone.top.toFixed(3)}, w {zone.width.toFixed(3)}, h {zone.height.toFixed(3)}, fontScale {fontScale.toFixed(2)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
