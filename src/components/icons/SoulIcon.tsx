import React from 'react';
import { Image } from 'react-native';

const LOGO = require('../../../assets/logo.png');

interface SoulIconProps {
  size?: number;
  color?: string;
}

export function SoulIcon({ size = 32 }: SoulIconProps) {
  return <Image source={LOGO} style={{ width: size, height: size }} resizeMode="contain" />;
}

export function SoulIconSmall({ size = 24 }: SoulIconProps) {
  return <Image source={LOGO} style={{ width: size, height: size }} resizeMode="contain" />;
}
