import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

const MOOD_SCORE: Record<string, number> = {
  good: 5,
  okay: 3,
  struggling: 1,
  angry: 1,
  anxious: 2,
  exhausted: 2,
};

const MOOD_COLOR: Record<string, string> = {
  good: '#BDB6C5',
  okay: '#8E8798',
  struggling: '#374151',
  angry: '#4B1D1D',
  anxious: '#1D2B3A',
  exhausted: '#2D3748',
};

interface DataPoint {
  date: string;
  mood: string | null;
  hadSession: boolean;
}

interface MoodChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

const CHART_PADDING = { top: 16, right: 12, bottom: 32, left: 24 };

export function MoodChart({ data, width = 320, height = 140 }: MoodChartProps) {
  const chartW = width - CHART_PADDING.left - CHART_PADDING.right;
  const chartH = height - CHART_PADDING.top - CHART_PADDING.bottom;
  const barCount = Math.min(data.length, 14);
  const recent = data.slice(-barCount);
  const barWidth = Math.max(8, (chartW / barCount) * 0.6);
  const gap = chartW / barCount;

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[1, 3, 5].map((level) => {
          const y = CHART_PADDING.top + chartH - (level / 5) * chartH;
          return (
            <Line
              key={level}
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_PADDING.left + chartW}
              y2={y}
              stroke="#272330"
              strokeWidth={1}
            />
          );
        })}

        {/* Bars */}
        {recent.map((point, i) => {
          const x = CHART_PADDING.left + i * gap + gap / 2 - barWidth / 2;
          const score = point.mood ? MOOD_SCORE[point.mood] ?? 3 : 0;
          const barH = Math.max(4, (score / 5) * chartH);
          const y = CHART_PADDING.top + chartH - barH;
          const color = point.mood ? MOOD_COLOR[point.mood] ?? '#BDB6C5' : '#272330';

          return (
            <React.Fragment key={point.date}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={barWidth / 3}
                fill={color}
                opacity={point.hadSession ? 0.5 : 1}
              />
              {point.hadSession && (
                <Rect
                  x={x + barWidth / 2 - 2}
                  y={CHART_PADDING.top + chartH + 6}
                  width={4}
                  height={4}
                  rx={2}
                  fill="#BDB6C5"
                  opacity={0.6}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Date labels — first and last */}
        {recent.length > 0 && (
          <>
            <SvgText
              x={CHART_PADDING.left + gap / 2}
              y={height - 4}
              fill="#8E8798"
              fontSize={9}
              textAnchor="middle"
            >
              {formatLabel(recent[0].date)}
            </SvgText>
            <SvgText
              x={CHART_PADDING.left + (recent.length - 0.5) * gap}
              y={height - 4}
              fill="#8E8798"
              fontSize={9}
              textAnchor="middle"
            >
              {formatLabel(recent[recent.length - 1].date)}
            </SvgText>
          </>
        )}
      </Svg>
      <View className="flex-row items-center gap-3 mt-1">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-sm bg-accent" />
          <Text className="text-text-muted text-xs">Mood</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-sm bg-accent/40" />
          <Text className="text-text-muted text-xs">Drinking day</Text>
        </View>
      </View>
    </View>
  );
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
