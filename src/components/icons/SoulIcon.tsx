import React from 'react';
import { Image } from 'react-native';

// The app icon itself — used as the little brand mark beside "ALCHONO" in the
// header, and larger on the auth/onboarding screens. Same asset everywhere.
const APP_ICON = require('../../../assets/icon.png');

interface SoulIconProps {
  size?: number;
  color?: string;
}

export function SoulIcon({ size = 32 }: SoulIconProps) {
  return (
    <Image
      source={APP_ICON}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      resizeMode="cover"
    />
  );
}

export function SoulIconSmall({ size = 24 }: SoulIconProps) {
  return (
    <Image
      source={APP_ICON}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      resizeMode="cover"
    />
  );
}
