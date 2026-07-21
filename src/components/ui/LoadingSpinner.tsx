import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  return (
    <View
      className={`items-center justify-center gap-3 ${fullScreen ? 'flex-1 bg-bg' : 'py-8'}`}
    >
      <ActivityIndicator size="large" color="#B2ACC0" />
      {message && (
        <Text className="text-text-secondary text-sm font-medium">{message}</Text>
      )}
    </View>
  );
}
