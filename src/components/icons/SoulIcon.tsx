import React from 'react';
import { Image } from 'react-native';

// Transparent plum-toned brand mark — sits directly on the app background
// (no black tile), used beside "ALCHONO" in the header and larger on the
// auth / onboarding screens.
const LOGO_MARK = require('../../../assets/logo-mark.png');

interface SoulIconProps {
  size?: number;
  color?: string;
}

export function SoulIcon({ size = 32 }: SoulIconProps) {
  return (
    <Image source={LOGO_MARK} style={{ width: size, height: size }} resizeMode="contain" />
  );
}

export function SoulIconSmall({ size = 24 }: SoulIconProps) {
  return (
    <Image source={LOGO_MARK} style={{ width: size, height: size }} resizeMode="contain" />
  );
}
