import React from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  username?: string | null;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-12 h-12', text: 'text-lg' },
  lg: { container: 'w-16 h-16', text: 'text-2xl' },
};

export function Avatar({ username, imageUrl, size = 'md' }: AvatarProps) {
  const initials = username ? username.charAt(0).toUpperCase() : '?';
  const { container, text } = sizeMap[size];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={`${container} rounded-full bg-surface`}
      />
    );
  }

  return (
    <View
      className={`${container} rounded-full bg-accent/20 border border-accent/30 items-center justify-center`}
    >
      <Text className={`${text} font-semibold text-accent`}>{initials}</Text>
    </View>
  );
}
