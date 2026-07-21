import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', ...rest }, ref) => {
    return (
      <View className="w-full">
        {label && (
          <Text className="text-text-secondary text-base font-medium mb-2">
            {label}
          </Text>
        )}
        <View
          className={`flex-row items-center bg-surface-2 border rounded-2xl px-4 py-4 ${
            error
              ? 'border-danger'
              : 'border-white/10 focus:border-accent'
          } ${className}`}
        >
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className="flex-1 text-text-primary text-lg font-sans"
            placeholderTextColor="#817B91"
            selectionColor="#B2ACC0"
            {...rest}
          />
          {rightIcon && <View className="ml-3">{rightIcon}</View>}
        </View>
        {error && (
          <Text className="text-danger text-base mt-1.5">{error}</Text>
        )}
        {hint && !error && (
          <Text className="text-text-muted text-base mt-1.5">{hint}</Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';
