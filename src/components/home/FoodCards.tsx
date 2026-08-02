import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;

/**
 * The three "Food for…" reads now live together in The Caff — so Home carries
 * one warm doorway into that room instead of three stacked feeds. Keeps Home
 * calm and makes the reads feel like a place you visit, not a feed you scroll.
 */
const PAPERS = [
  { label: 'The Gazette', hint: 'good news' },
  { label: 'The Funnies', hint: 'a laugh' },
  { label: 'The Letters', hint: 'a dilemma' },
];

export function FoodCards() {
  const router = useRouter();
  return (
    <View className="mt-8 px-6">
      <Pressable
        onPress={() => router.push('/caff' as any)}
        className="active:opacity-90"
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(224,176,128,0.32)',
          backgroundColor: 'rgba(224,176,128,0.08)',
          padding: 18,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text style={{ fontFamily: 'SkinnyCustard', fontSize: 26, lineHeight: 30, color: '#ECE9F1' }}>The Caff</Text>
            <Text style={{ color: '#B2ACC0', fontSize: 13.5, marginTop: 2 }}>Pull up a chair — a few minutes off.</Text>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,176,128,0.16)', borderWidth: 1, borderColor: 'rgba(224,176,128,0.4)' }}>
            <Feather name="coffee" size={19} color="#E0B080" />
          </View>
        </View>

        {/* The three papers on the table. */}
        <View className="flex-row" style={{ gap: 8, marginTop: 14 }}>
          {PAPERS.map((p) => (
            <View key={p.label} style={{ flex: 1, borderRadius: 10, backgroundColor: 'rgba(20,18,24,0.5)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)', paddingVertical: 9, paddingHorizontal: 8 }}>
              <Text style={{ color: '#ECE9F1', fontSize: 12.5, fontWeight: '600' }} numberOfLines={1}>{p.label}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: '#817B91', marginTop: 1 }} numberOfLines={1}>{p.hint}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </View>
  );
}
