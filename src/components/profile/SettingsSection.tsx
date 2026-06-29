import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SettingItem {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}

interface SettingsSectionProps {
  title?: string;
  items: SettingItem[];
}

export function SettingsSection({ title, items }: SettingsSectionProps) {
  return (
    <View className="mx-6 mb-4">
      {title && (
        <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2 ml-1">
          {title}
        </Text>
      )}
      <View className="bg-surface rounded-2xl overflow-hidden border border-white/5">
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <View className="h-px bg-white/5 mx-4" />}
            <Pressable
              onPress={item.onPress}
              disabled={!item.onPress}
              className="flex-row items-center px-4 py-3.5 active:bg-white/5"
            >
              <View className="flex-1 flex-row items-center gap-3">
                {item.rightElement ? null : null}
                <Text
                  className={`text-sm font-medium flex-1 ${
                    item.danger ? 'text-danger' : 'text-text-primary'
                  }`}
                >
                  {item.label}
                </Text>
              </View>
              {item.value && (
                <Text className="text-text-muted text-sm mr-2">{item.value}</Text>
              )}
              {item.rightElement ??
                (item.onPress && (
                  <Feather name="chevron-right" size={16} color="#5E6472" />
                ))}
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
