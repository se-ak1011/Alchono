import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { DrawnForm, TickZone, type Rect } from "@/components/paper/DrawnForm";

/**
 * The reading-corner table — the loft's round coffee table close-up: the
 * magazine stack, a coffee, and the folded resources note. Tap the note for the
 * resources list; tap the stack for the magazine carousel. Taps are positionable
 * in the editor, then exported + baked.
 */
const TABLE = require("../../assets/reading/reading-table.png");

const R = {
  t_note: { x: 0.08, y: 0.45, w: 0.26, h: 0.12 } as Rect,
  t_stack: { x: 0.38, y: 0.36, w: 0.52, h: 0.38 } as Rect,
} as const;

export default function ReadingTable() {
  const router = useRouter();
  const go = (r: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(r as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <DrawnForm source={TABLE} label="reading-table" tint="light" onBack={() => router.back()}>
        <LinkZone id="t_note" rect={R.t_note} onPress={() => go("/resources/note")} />
        <LinkZone id="t_stack" rect={R.t_stack} onPress={() => go("/reading")} />
      </DrawnForm>
    </View>
  );
}

/** An invisible tap over a drawn object. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return <TickZone id={id} rect={rect} value={false} onToggle={onPress} />;
}
