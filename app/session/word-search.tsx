import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

const GRID_SIZE = 9;
const CELL_SIZE = 36;
const WORDS = ['CALM', 'HOPE', 'FREE', 'PEACE', 'BRAVE', 'CLEAR', 'STILL', 'REST'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function seededRng(seed: number) {
  let s = ((seed >>> 0) || 1) & 0xffffffff;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type WordEntry = { word: string; row: number; col: number; horizontal: boolean };

function buildGrid(seed: number): { cells: string[][]; entries: WordEntry[] } {
  const rng = seededRng(seed);
  const cells: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(''),
  );
  const entries: WordEntry[] = [];
  const shuffled = [...WORDS].sort(() => rng() - 0.5);

  for (const word of shuffled) {
    let placed = false;
    for (let attempt = 0; attempt < 120 && !placed; attempt++) {
      const horizontal = rng() > 0.5;
      const maxRow = horizontal ? GRID_SIZE - 1 : GRID_SIZE - word.length;
      const maxCol = horizontal ? GRID_SIZE - word.length : GRID_SIZE - 1;
      if (maxRow < 0 || maxCol < 0) continue;
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
        entries.push({ word, row, col, horizontal });
        placed = true;
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
  return { cells, entries };
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
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    for (let c = minC; c <= maxC; c++) cells.push([r1, c]);
    return cells;
  }
  if (c1 === c2) {
    const cells: [number, number][] = [];
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (let r = minR; r <= maxR; r++) cells.push([r, c1]);
    return cells;
  }
  return [start];
}

export default function WordSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = Math.floor(Date.now() / 86400000);
  const { cells, entries } = useMemo(() => buildGrid(today), [today]);

  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [selCells, setSelCells] = useState<Set<string>>(new Set());

  const selStartRef = useRef<[number, number] | null>(null);
  const selEndRef = useRef<[number, number] | null>(null);
  const foundWordsRef = useRef<Set<string>>(new Set());
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
      if (path.length >= 2) {
        const word = path.map(([r, c]) => cells[r][c]).join('');
        const reversed = [...word].reverse().join('');
        const match = WORDS.find(
          (w) => !foundWordsRef.current.has(w) && (w === word || w === reversed),
        );
        if (match) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const nw = new Set([...foundWordsRef.current, match]);
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

  const placedWords = WORDS.filter((w) => entries.some((e) => e.word === w));
  const allFound = foundWords.size >= placedWords.length && placedWords.length > 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0F10',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
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
          <Text style={{ color: '#6B7280', fontSize: 14 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#F0F2F4',
              fontSize: 20,
              fontFamily: 'Inter_600SemiBold',
              ...headingShadow,
            }}
          >
            {allFound ? 'All found.' : 'Daily word search.'}
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
            {allFound
              ? 'Good. Keep going.'
              : `${foundWords.size} of ${placedWords.length} found — drag to select`}
          </Text>
        </View>
      </Animated.View>

      {/* Word chips */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: 24,
          marginBottom: 24,
        }}
      >
        {placedWords.map((word, i) => {
          const found = foundWords.has(word);
          return (
            <Animated.View
              key={word}
              entering={FadeInDown.duration(300).delay(i * 40)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: found ? '#1E2022' : '#161718',
                borderWidth: 1,
                borderColor: found ? 'rgba(196,201,208,0.2)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <Text
                style={{
                  color: found ? '#6B7280' : '#F0F2F4',
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  letterSpacing: 1.5,
                  textDecorationLine: found ? 'line-through' : 'none',
                }}
              >
                {word}
              </Text>
            </Animated.View>
          );
        })}
      </View>

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
                          ? 'rgba(196,201,208,0.14)'
                          : isSel
                            ? 'rgba(196,201,208,0.07)'
                            : 'transparent',
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: isFound
                            ? '#C4C9D0'
                            : isSel
                              ? '#D0D5DC'
                              : '#3D4450',
                          fontSize: 15,
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
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        {allFound ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <Pressable
              onPress={() => router.back()}
              style={{
                backgroundColor: '#C4C9D0',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#0E0F10',
                  fontSize: 15,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                Done
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text
              style={{
                color: '#6B7280',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Back
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
