import React from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  Text,
  type ModalProps as RNModalProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalProps extends Omit<RNModalProps, 'children'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showHandle?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  showHandle = true,
  ...rest
}: ModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
      {...rest}
    >
      <Pressable
        className="flex-1 bg-black/60"
        onPress={onClose}
      >
        <BlurView
          intensity={20}
          tint="dark"
          className="flex-1"
        />
      </Pressable>
      <View
        className="bg-surface rounded-t-3xl"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {showHandle && (
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-white/20" />
          </View>
        )}
        {title && (
          <View className="px-6 pt-4 pb-2">
            <Text className="text-text-primary text-lg font-semibold tracking-tight">
              {title}
            </Text>
          </View>
        )}
        <View className="px-6 pt-2">{children}</View>
      </View>
    </RNModal>
  );
}
