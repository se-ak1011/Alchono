import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { headingShadow } from '@/styles';

type Variant = 'heading' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
type Color = 'primary' | 'secondary' | 'accent' | 'muted' | 'white';

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: Color;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  heading: 'text-3xl font-semibold tracking-tight',
  title: 'text-xl font-semibold tracking-tight',
  subtitle: 'text-lg font-medium',
  body: 'text-base font-sans',
  caption: 'text-sm font-sans',
  label: 'text-xs font-medium tracking-wide uppercase',
};

const colorClasses: Record<Color, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  accent: 'text-accent',
  muted: 'text-text-muted',
  white: 'text-white',
};

export function Text({
  variant = 'body',
  color = 'primary',
  className = '',
  children,
  style,
  ...rest
}: TextProps) {
  const shadowStyle = variant === 'heading' || variant === 'title' ? headingShadow : undefined;
  return (
    <RNText
      className={`${variantClasses[variant]} ${colorClasses[color]} ${className}`}
      style={shadowStyle ? [shadowStyle, style] : style}
      {...rest}
    >
      {children}
    </RNText>
  );
}
