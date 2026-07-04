import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Depth } from './Depth';

interface SafeAreaProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  /** Render the premium depth layer behind content. Default on; opt out for
   *  full-bleed screens that paint their own background (e.g. the constellation). */
  depth?: boolean;
}

export function SafeArea({
  children,
  className = '',
  top = true,
  bottom = true,
  depth = true,
  ...rest
}: SafeAreaProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: top ? insets.top : 0,
        paddingBottom: bottom ? insets.bottom : 0,
      }}
      className={`bg-bg ${className}`}
      {...rest}
    >
      {depth && <Depth />}
      {children}
    </View>
  );
}
