import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
}

export function SafeArea({
  children,
  className = '',
  top = true,
  bottom = true,
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
      {children}
    </View>
  );
}
