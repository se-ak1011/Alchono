import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

interface TriggerData {
  label: string;
  count: number;
}

interface PatternChartProps {
  triggers: TriggerData[];
  title?: string;
}

export function PatternChart({
  triggers,
  title = 'Common triggers',
}: PatternChartProps) {
  if (triggers.length === 0) {
    return (
      <View className="py-6 items-center">
        <Text className="text-text-muted text-sm text-center">
          Patterns will appear as you add journal entries.
        </Text>
      </View>
    );
  }

  const max = Math.max(...triggers.map((t) => t.count), 1);
  const BAR_MAX_W = 200;

  return (
    <View>
      {title && (
        <Text className="text-text-primary font-semibold text-sm mb-3">
          {title}
        </Text>
      )}
      {triggers.slice(0, 6).map((t, i) => {
        const pct = t.count / max;
        const barW = Math.max(4, pct * BAR_MAX_W);

        return (
          <View key={t.label} className="flex-row items-center gap-3 mb-2.5">
            <Text className="text-text-secondary text-xs w-20">{t.label}</Text>
            <View className="flex-1 h-5 justify-center">
              <View
                className="h-1.5 rounded-full bg-accent"
                style={{ width: barW, opacity: 0.6 + pct * 0.4 }}
              />
            </View>
            <Text className="text-text-muted text-xs w-4 text-right">
              {t.count}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
