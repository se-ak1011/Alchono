import React, { useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, Image, ImageBackground, PanResponder, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BOOKS } from "@/data/books";
import { TOOLKIT, type ToolkitCategory, type ToolSection } from "@/lib/toolkit";

const INK = "#332a24"; // warm dark ink on the cream page
const INK_SOFT = "#6a5d52";

type Zone = { left: number; top: number; width: number; height: number };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// One shared template for every magazine (all spreads are the same 851×1847
// layout: a drawn title top-of-page + purple rule, empty body below). The body
// text is overlaid into these two zones — LEFT page = article 1, RIGHT page =
// article 2. Zones are image-relative fractions so one set holds on any phone;
// dial them in with the pencil and bake the Export numbers back here.
const PAGE_LEFT: Zone = { left: 0.085, top: 0.4, width: 0.375, height: 0.28 };
const PAGE_RIGHT: Zone = { left: 0.525, top: 0.37, width: 0.375, height: 0.31 };

function Section({ s, scale }: { s: ToolSection; scale: number }) {
  const fs = (n: number) => n * scale;
  switch (s.type) {
    case "heading":
      return <Text style={{ color: INK, fontFamily: "PatrickHand", fontSize: fs(16), marginTop: 8, marginBottom: 3 }}>{s.text}</Text>;
    case "paragraph":
      return <Text style={{ color: INK, fontSize: fs(12), lineHeight: fs(17), marginBottom: 6 }}>{s.text}</Text>;
    case "callout":
      return <Text style={{ color: INK_SOFT, fontSize: fs(11.5), lineHeight: fs(16), marginBottom: 6, fontStyle: "italic" }}>{s.text}</Text>;
    case "steps":
      return (
        <View style={{ marginBottom: 6, gap: 2 }}>
          {s.items.map((it, i) => (
            <Text key={i} style={{ color: INK, fontSize: fs(12), lineHeight: fs(17) }}>{`${i + 1}.  ${it}`}</Text>
          ))}
        </View>
      );
    case "list":
    case "lines":
      return (
        <View style={{ marginBottom: 6, gap: 2 }}>
          {s.items.map((it, i) => (
            <Text key={i} style={{ color: INK, fontSize: fs(12), lineHeight: fs(17) }}>{`•  ${it}`}</Text>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export default function BookReaderScreen() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const category = cat as ToolkitCategory;
  const art = BOOKS[category];
  const articles = TOOLKIT.filter((t) => t.category === category);

  // No drawn magazine for this category — fall back to the plain list screen.
  if (!art) {
    router.replace(`/toolkit/c/${category}` as any);
    return <View style={{ flex: 1, backgroundColor: "#0d0b12" }} />;
  }

  const src = Image.resolveAssetSource(art.open);
  const imgW = src?.width || 851;
  const imgH = src?.height || 1847;

  // Contain-fit: show the WHOLE spread (never crop the drawn titles/rules), the
  // dark room showing in the letterbox. Zones anchor to this contained rect.
  const sc = Math.min(width / imgW, height / imgH);
  const dispW = imgW * sc;
  const dispH = imgH * sc;
  const offX = (width - dispW) / 2;
  const offY = (height - dispH) / 2;

  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState<"left" | "right">("left");
  const [zones, setZones] = useState<{ left: Zone; right: Zone }>({ left: PAGE_LEFT, right: PAGE_RIGHT });
  const [fs, setFs] = useState<{ left: number; right: number }>({ left: art.fontScale ?? 0.8, right: art.fontScale ?? 0.8 });
  const [showExport, setShowExport] = useState(false);

  // Refs mirror state so the two PanResponders (created once) read live values.
  const editingRef = useRef(editing); editingRef.current = editing;
  const selRef = useRef(sel); selRef.current = sel;
  const zonesRef = useRef(zones); zonesRef.current = zones;
  const dim = useRef({ dispW, dispH }); dim.current = { dispW, dispH };
  const startZone = useRef<Zone>(zones.left);
  const resizingRef = useRef(false);

  const move = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => editingRef.current && !resizingRef.current,
      onMoveShouldSetPanResponderCapture: () => editingRef.current && !resizingRef.current,
      onPanResponderGrant: () => { startZone.current = zonesRef.current[selRef.current]; },
      onPanResponderMove: (_, g) => {
        const k = selRef.current;
        setZones((z) => ({
          ...z,
          [k]: {
            ...z[k],
            left: clamp(startZone.current.left + g.dx / dim.current.dispW, -0.2, 0.95),
            top: clamp(startZone.current.top + g.dy / dim.current.dispH, 0.02, 0.94),
          },
        }));
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
      onPanResponderGrant: () => { resizingRef.current = true; startZone.current = zonesRef.current[selRef.current]; },
      onPanResponderMove: (_, g) => {
        const k = selRef.current;
        setZones((z) => ({
          ...z,
          [k]: {
            ...z[k],
            width: clamp(startZone.current.width + g.dx / dim.current.dispW, 0.12, 0.6),
            height: clamp(startZone.current.height + g.dy / dim.current.dispH, 0.06, 0.9),
          },
        }));
      },
      onPanResponderRelease: () => { resizingRef.current = false; },
      onPanResponderTerminate: () => { resizingRef.current = false; },
    }),
  ).current;

  const boxOf = (z: Zone) => ({
    position: "absolute" as const,
    left: offX + z.left * dispW,
    top: offY + z.top * dispH,
    width: z.width * dispW,
    height: z.height * dispH,
  });

  const pageSections = (i: number) => articles[i]?.sections ?? [];

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // A single body column — scrolls on its own when not editing, static (so the
  // box can be dragged) while editing. A render function (not a nested
  // component) so it reconciles in place instead of remounting each render.
  const renderPage = (which: "left" | "right") => {
    const i = which === "left" ? 0 : 1;
    const sections = pageSections(i);
    const scale = fs[which];
    const selected = editing && sel === which;
    const body = (
      <View style={{ paddingHorizontal: 4 }}>
        {sections.map((s, k) => <Section key={k} s={s} scale={scale} />)}
      </View>
    );
    return (
      <Pressable
        key={which}
        style={boxOf(zones[which])}
        onPress={editing ? () => { setSel(which); setShowExport(false); } : undefined}
        {...(selected ? move.panHandlers : {})}
      >
        {editing ? (
          <View style={{ flex: 1 }}>{body}</View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>{body}</ScrollView>
        )}
        {editing ? (
          <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: selected ? "rgba(164,137,222,0.95)" : "rgba(164,137,222,0.4)", borderStyle: "dashed", backgroundColor: selected ? "rgba(164,137,222,0.1)" : "rgba(164,137,222,0.03)" }} />
        ) : null}
        {selected ? (
          <View {...resize.panHandlers} style={{ position: "absolute", right: -14, bottom: -14, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(164,137,222,0.98)" }}>
            <Feather name="maximize-2" size={15} color="#141019" />
          </View>
        ) : null}
      </Pressable>
    );
  };

  const z = zones[sel];

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <ImageBackground source={art.open} style={{ flex: 1 }} resizeMode="contain">
        {renderPage("left")}
        {articles.length > 1 || editing ? renderPage("right") : null}
      </ImageBackground>

      {/* Back out to the magazine stack. */}
      <Pressable
        onPress={goBack}
        hitSlop={12}
        style={{ position: "absolute", top: 52, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(13,11,18,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}
      >
        <Feather name="arrow-left" size={20} color="#ECE9F1" />
      </Pressable>

      {/* Pencil toggle, top-right. */}
      <Pressable
        onPress={() => { setEditing((e) => !e); setShowExport(false); }}
        hitSlop={10}
        style={{ position: "absolute", top: 52, right: 16, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: editing ? "rgba(164,137,222,0.95)" : "rgba(13,11,18,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}
      >
        <Feather name={editing ? "check" : "edit-2"} size={19} color={editing ? "#141019" : "#ECE9F1"} />
      </Pressable>

      {/* Zone selector + font + export, only while editing. */}
      {editing ? (
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 34, backgroundColor: "rgba(20,17,28,0.97)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 12, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#ECE9F1", fontSize: 13, fontWeight: "600" }}>Editing page</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["left", "right"] as const).map((k) => (
                <Pressable key={k} onPress={() => { setSel(k); setShowExport(false); }} style={{ paddingHorizontal: 14, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: sel === k ? "rgba(164,137,222,0.9)" : "rgba(255,255,255,0.08)" }}>
                  <Text style={{ color: sel === k ? "#141019" : "#ECE9F1", fontSize: 13, fontWeight: sel === k ? "700" : "400" }}>{k === "left" ? "Left" : "Right"}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#ECE9F1", fontSize: 13, fontWeight: "600" }}>Text size</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Pressable onPress={() => setFs((s) => ({ ...s, [sel]: clamp(+(s[sel] - 0.05).toFixed(2), 0.6, 2) }))} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" }}>
                <Text style={{ color: "#ECE9F1", fontSize: 20 }}>−</Text>
              </Pressable>
              <Text style={{ color: "#ECE9F1", fontSize: 14, width: 44, textAlign: "center" }}>{fs[sel].toFixed(2)}×</Text>
              <Pressable onPress={() => setFs((s) => ({ ...s, [sel]: clamp(+(s[sel] + 0.05).toFixed(2), 0.6, 2) }))} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" }}>
                <Text style={{ color: "#ECE9F1", fontSize: 20 }}>+</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={() => setShowExport((v) => !v)} style={{ borderRadius: 8, paddingVertical: 9, alignItems: "center", backgroundColor: "rgba(164,137,222,0.9)" }}>
            <Text style={{ color: "#141019", fontSize: 13, fontWeight: "700" }}>{showExport ? "Hide" : "Export coordinates"}</Text>
          </Pressable>
          {showExport ? (
            <Text selectable style={{ color: "#C9C2D6", fontSize: 12, lineHeight: 18 }}>
              {`reading spread\nLEFT  left ${zones.left.left.toFixed(3)}, top ${zones.left.top.toFixed(3)}, w ${zones.left.width.toFixed(3)}, h ${zones.left.height.toFixed(3)}, fontScale ${fs.left.toFixed(2)}\nRIGHT left ${zones.right.left.toFixed(3)}, top ${zones.right.top.toFixed(3)}, w ${zones.right.width.toFixed(3)}, h ${zones.right.height.toFixed(3)}, fontScale ${fs.right.toFixed(2)}`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
