import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { headingShadow } from '@/styles';

const GRID_SIZE = 9;
// Fit the 9-column grid with at least 8px breathing room on narrow screens.
const CELL_SIZE = Math.min(
  40,
  Math.floor((Dimensions.get('window').width - 16) / GRID_SIZE),
);

// No list to complete — the grid is quietly full of these. You just find.
const HAPPY_WORDS = [
  'CALM', 'HOPE', 'FREE', 'PEACE', 'BRAVE', 'CLEAR', 'STILL', 'REST',
  'JOY', 'KIND', 'WARM', 'LIGHT', 'SMILE', 'LAUGH', 'HAPPY', 'GROW',
  'HEAL', 'ALIVE', 'SHINE', 'BLOOM', 'DREAM', 'TRUST', 'GRACE', 'EASY',
  'SOFT', 'STRONG', 'PROUD', 'LOVED', 'SAFE', 'HOME', 'SUNNY', 'GLOW',
  'RISE', 'DANCE', 'MUSIC', 'OCEAN', 'RIVER', 'BREEZE', 'SPRING', 'GOLD',
];
const MAX_PLACED = 12;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DICTIONARY = new Set(HAPPY_WORDS);

function seededRng(seed: number) {
  let s = ((seed >>> 0) || 1) & 0xffffffff;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildGrid(seed: number): string[][] {
  const rng = seededRng(seed);
  const cells: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(''),
  );
  const shuffled = [...HAPPY_WORDS].sort(() => rng() - 0.5);
  let placed = 0;

  for (const word of shuffled) {
    if (placed >= MAX_PLACED) break;
    for (let attempt = 0; attempt < 120; attempt++) {
      const horizontal = rng() > 0.5;
      const maxRow = horizontal ? GRID_SIZE - 1 : GRID_SIZE - word.length;
      const maxCol = horizontal ? GRID_SIZE - word.length : GRID_SIZE - 1;
      if (maxRow < 0 || maxCol < 0) break;
      const row = Math.floor(rng() * (maxRow + 1));
      const col = Math.floor(rng() * (maxCol + 1));
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        if (cells[r][c] !== '' && cells[r][c] !== word[i]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        for (let i = 0; i < word.length; i++) {
          const r = horizontal ? row : row + i;
          const c = horizontal ? col + i : col;
          cells[r][c] = word[i];
        }
        placed++;
        break;
      }
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (cells[r][c] === '') {
        cells[r][c] = ALPHABET[Math.floor(rng() * ALPHABET.length)];
      }
    }
  }
  return cells;
}

function posToCell(x: number, y: number): [number, number] | null {
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
  return [row, col];
}

function pathBetween(
  start: [number, number],
  end: [number, number],
): [number, number][] {
  const [r1, c1] = start;
  const [r2, c2] = end;
  if (r1 === r2) {
    const cells: [number, number][] = [];
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) cells.push([r1, c]);
    return cells;
  }
  if (c1 === c2) {
    const cells: [number, number][] = [];
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) cells.push([r, c1]);
    return cells;
  }
  return [start];
}

export default function WordSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = Math.floor(Date.now() / 86400000);

  const [gridIndex, setGridIndex] = useState(0);
  const cells = useMemo(() => buildGrid(today + gridIndex * 7919), [today, gridIndex]);

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [selCells, setSelCells] = useState<Set<string>>(new Set());

  const selStartRef = useRef<[number, number] | null>(null);
  const selEndRef = useRef<[number, number] | null>(null);
  const foundWordsRef = useRef<string[]>([]);
  const foundCellsRef = useRef<Set<string>>(new Set());

  const onGestureBegin = useCallback((x: number, y: number) => {
    const cell = posToCell(x, y);
    if (!cell) return;
    selStartRef.current = cell;
    selEndRef.current = cell;
    setSelCells(new Set([`${cell[0]},${cell[1]}`]));
  }, []);

  const onGestureUpdate = useCallback((x: number, y: number) => {
    const cell = posToCell(x, y);
    if (!cell || !selStartRef.current) return;
    selEndRef.current = cell;
    const path = pathBetween(selStartRef.current, cell);
    setSelCells(new Set(path.map(([r, c]) => `${r},${c}`)));
  }, []);

  const onGestureEnd = useCallback(() => {
    const start = selStartRef.current;
    const end = selEndRef.current;
    selStartRef.current = null;
    selEndRef.current = null;

    if (start && end) {
      const path = pathBetween(start, end);
      if (path.length >= 3) {
        const word = path.map(([r, c]) => cells[r][c]).join('');
        const reversed = [...word].reverse().join('');
        const match =
          DICTIONARY.has(word) && !foundWordsRef.current.includes(word)
            ? word
            : DICTIONARY.has(reversed) && !foundWordsRef.current.includes(reversed)
              ? reversed
              : null;
        if (match) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const nw = [...foundWordsRef.current, match];
          foundWordsRef.current = nw;
          const nc = new Set([
            ...foundCellsRef.current,
            ...path.map(([r, c]) => `${r},${c}`),
          ]);
          foundCellsRef.current = nc;
          setFoundWords(nw);
          setFoundCells(nc);
        }
      }
    }
    setSelCells(new Set());
  }, [cells]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          runOnJS(onGestureBegin)(e.x, e.y);
        })
        .onUpdate((e) => {
          runOnJS(onGestureUpdate)(e.x, e.y);
        })
        .onEnd(() => {
          runOnJS(onGestureEnd)();
        })
        .onFinalize(() => {
          runOnJS(onGestureEnd)();
        }),
    [onGestureBegin, onGestureUpdate, onGestureEnd],
  );

  const newGrid = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGridIndex((i) => i + 1);
    setFoundWords([]);
    setFoundCells(new Set());
    setSelCells(new Set());
    foundWordsRef.current = [];
    foundCellsRef.current = new Set();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ZoneGlow zone="games" intensity={0.55} />
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#ECE9F1',
              fontSize: 26,
              fontFamily: 'Inter_600SemiBold',
              ...headingShadow,
            }}
          >
            Find the good words.
          </Text>
          <Text style={{ color: '#817B91', fontSize: 15, marginTop: 2 }}>
            No list. No clock. They're in there — drag when you spot one.
          </Text>
        </View>
      </Animated.View>

      {/* Grid */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <GestureDetector gesture={gesture}>
          <View
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
            }}
          >
            {cells.map((row, r) => (
              <View key={r} style={{ flexDirection: 'row' }}>
                {row.map((letter, c) => {
                  const key = `${r},${c}`;
                  const isFound = foundCells.has(key);
                  const isSel = selCells.has(key);
                  return (
                    <View
                      key={c}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isFound
                          ? 'rgba(155, 130, 208, 0.12)'
                          : isSel
                            ? 'rgba(155, 130, 208, 0.12)'
                            : 'transparent',
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: isFound ? '#A489DE' : isSel ? '#ECE9F1' : '#686271',
                          fontSize: 17,
                          fontFamily: 'Inter_600SemiBold',
                        }}
                      >
                        {letter}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </GestureDetector>

        {/* What you've found so far — a quiet trail, not a checklist */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            paddingHorizontal: 24,
            marginTop: 20,
            justifyContent: 'center',
            minHeight: 34,
          }}
        >
          {foundWords.map((word) => (
            <Animated.View
              key={word}
              entering={FadeIn.duration(300)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: '#474151',
                borderWidth: 1,
                borderColor: 'rgba(200, 185, 220, 0.24)',
              }}
            >
              <Text
                style={{
                  color: '#A489DE',
                  fontSize: 14,
                  fontFamily: 'Inter_600SemiBold',
                  letterSpacing: 1.5,
                }}
              >
                {word}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Pressable
          onPress={newGrid}
          style={{
            flex: 1,
            backgroundColor: '#383243',
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(243, 240, 244, 0.10)',
          }}
        >
          <Text style={{ color: '#B2ACC0', fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
            New grid
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={{
            flex: 1,
            backgroundColor: '#A489DE',
            borderRadius: 18,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#201D28', fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
            Done
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
