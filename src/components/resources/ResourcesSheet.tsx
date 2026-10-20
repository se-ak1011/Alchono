import React from 'react';
import { View, Linking, type ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DrawnForm, TickZone, type Rect } from '@/components/paper/DrawnForm';

/**
 * The resources list — the same services everywhere, as single tappable lines
 * (no tabs). Shown two ways: the typewriter "yellow pages" book in the living
 * room, and the handwritten loose note everywhere else inside. Both use this
 * one component — only the art and the line positions differ. Each line opens
 * its number / text / link; position the invisible taps over the drawn lines in
 * the pencil editor, then export + bake.
 */
export type ResourceLine = { id: string; url: string };

export const RESOURCE_LINES: ResourceLine[] = [
  { id: 'res_999', url: 'tel:999' },
  { id: 'res_samaritans', url: 'tel:116123' },
  { id: 'res_111', url: 'tel:111' },
  { id: 'res_drinkline', url: 'tel:03001231110' },
  { id: 'res_aa', url: 'tel:08009177650' },
  { id: 'res_shout', url: 'sms:85258' },
  { id: 'res_nhs', url: 'https://www.nhs.uk/live-well/alcohol-advice/' },
  { id: 'res_7cups', url: 'https://www.7cups.com' },
  { id: 'res_aameet', url: 'https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting' },
  { id: 'res_smart', url: 'https://smartrecovery.org.uk' },
];

export function ResourcesSheet({
  source,
  label,
  rects,
}: {
  source: ImageSourcePropType;
  label: string;
  rects: Record<string, Rect>;
}) {
  const router = useRouter();
  const open = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <DrawnForm source={source} label={label} tint="light" onBack={() => router.back()}>
        {RESOURCE_LINES.map((l) => (
          <TickZone
            key={l.id}
            id={l.id}
            rect={rects[l.id] ?? { x: 0.1, y: 0.1, w: 0.3, h: 0.05 }}
            value={false}
            onToggle={() => open(l.url)}
          />
        ))}
      </DrawnForm>
    </View>
  );
}
