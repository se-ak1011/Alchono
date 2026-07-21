import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { COMPANIONS, DEFAULT_COMPANION_ID } from '@/lib/companions';

/**
 * The first-meeting picker: a swipeable carousel of head-and-shoulders cards.
 * The card in the centre is the chosen mate; swiping (or tapping a neighbour)
 * selects them. Used in onboarding — a warmer intro than a full-body list.
 */
export function CompanionCarousel({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const CARD = Math.min(248, width * 0.68);
  const GAP = 18;
  const ITEM = CARD + GAP;
  const sidePad = (width - ITEM) / 2;

  const startIndex = Math.max(
    0,
    COMPANIONS.findIndex((c) => c.id === (value ?? DEFAULT_COMPANION_ID)),
  );
  const [active, setActive] = useState(startIndex);
  const scrollRef = useRef<ScrollView>(null);

  const select = (i: number) => {
    setActive(i);
    onChange(COMPANIONS[i].id);
  };

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / ITEM);
    const clamped = Math.max(0, Math.min(COMPANIONS.length - 1, i));
    if (clamped !== active) Haptics.selectionAsync();
    select(clamped);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: sidePad }}
        contentOffset={{ x: startIndex * ITEM, y: 0 }}
        onMomentumScrollEnd={onEnd}
      >
        {COMPANIONS.map((c, i) => {
          const isActive = i === active;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                scrollRef.current?.scrollTo({ x: i * ITEM, animated: true });
                select(i);
              }}
              style={{ width: CARD, marginHorizontal: GAP / 2 }}
            >
              <View
                className={`rounded-3xl border ${
                  isActive ? 'border-accent' : 'border-white/8'
                }`}
                style={{
                  backgroundColor: '#474151',
                  opacity: isActive ? 1 : 0.55,
                  overflow: 'hidden',
                }}
              >
                <View
                  className="items-center justify-start"
                  style={{ height: 170, overflow: 'hidden' }}
                >
                  <CompanionArt
                    source={c.poses.standing}
                    width={CARD * 1.05}
                    height={CARD * 1.05 * 1.5}
                    cropHeight={170}
                    opacity={1}
                  />
                </View>
                <View className="px-4 pb-5 pt-3 items-center">
                  <Text className="text-text-primary text-xl font-semibold">
                    {c.name}
                  </Text>
                  <Text className="text-text-muted text-sm text-center mt-1 leading-relaxed">
                    {c.blurb}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        className="flex-row justify-center items-center mt-5"
        style={{ gap: 6 }}
      >
        {COMPANIONS.map((_, i) => (
          <View
            key={i}
            className={`rounded-full ${i === active ? 'bg-accent' : 'bg-surface-2'}`}
            style={{ width: i === active ? 18 : 6, height: 6 }}
          />
        ))}
      </View>
    </View>
  );
}
