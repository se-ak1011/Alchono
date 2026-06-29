import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';

interface InsightCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const trendConfig = {
  up: { symbol: '↑', color: 'text-accent' },
  down: { symbol: '↓', color: 'text-danger' },
  neutral: { symbol: '→', color: 'text-text-muted' },
};

export function InsightCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: InsightCardProps) {
  return (
    <Card className="flex-1">
      <View className="flex-row items-start justify-between mb-2">
        {icon && <Text className="text-2xl">{icon}</Text>}
        {trend && (
          <Text
            className={`text-sm font-semibold ${trendConfig[trend].color}`}
          >
            {trendConfig[trend].symbol}
          </Text>
        )}
      </View>
      <Text className="text-text-primary text-2xl font-bold tracking-tight">
        {value}
      </Text>
      <Text className="text-text-secondary text-sm font-medium mt-0.5">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-text-muted text-xs mt-1">{subtitle}</Text>
      )}
    </Card>
  );
}
