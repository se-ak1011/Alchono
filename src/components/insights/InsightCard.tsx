import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';

interface InsightCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  symbol?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const trendConfig = {
  up:      { symbol: '↑', color: 'text-accent' },
  down:    { symbol: '↓', color: 'text-danger' },
  neutral: { symbol: '→', color: 'text-text-muted' },
};

export function InsightCard({ title, value, subtitle, symbol, trend }: InsightCardProps) {
  return (
    <Card className="flex-1">
      <View className="flex-row items-start justify-between mb-3">
        {symbol && <Text className="text-text-muted text-xs">{symbol}</Text>}
        {trend && (
          <Text className={`text-xs ${trendConfig[trend].color}`}>
            {trendConfig[trend].symbol}
          </Text>
        )}
      </View>
      {/* The number anchors its own card — bold + size, but no glow: a grid of
          glowing numbers all compete. Tone/size carry it. */}
      <Text className="text-text-primary text-2xl font-semibold tracking-tight">
        {value}
      </Text>
      <Text className="text-text-muted text-xs font-medium tracking-wider uppercase mt-1">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-text-muted text-xs mt-0.5">{subtitle}</Text>
      )}
    </Card>
  );
}
