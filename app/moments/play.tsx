import React from 'react';
import { View, Image, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Feather } from '@expo/vector-icons';

/** Fullscreen viewer for a moment — plays videos, shows photos large. */
export default function PlayMomentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uri, type } = useLocalSearchParams<{ uri?: string; type?: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {uri ? (
        type === 'video' ? (
          <Video
            source={{ uri }}
            shouldPlay
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            style={{ flex: 1 }}
          />
        ) : (
          <Image source={{ uri }} style={{ flex: 1 }} resizeMode="contain" />
        )
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#817B91' }}>Nothing to play.</Text>
        </View>
      )}

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          right: 18,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="x" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}
